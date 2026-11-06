import { NextResponse } from "next/server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import {
  readMarketplaceFiltersStrict,
  saveMarketplaceFilters,
} from "@/lib/cms/server/marketplace-config.server";
import {
  readProductsStrict,
  updateProductReferences,
} from "@/lib/cms/server/products.server";
import { addAuditLogDurable } from "@/lib/cms/server/audit-logs.server";
import {
  invalidateCatalog,
  invalidateProducts,
} from "@/lib/cms/server/cache-invalidation.server";
import { publicApiError } from "@/lib/security/public-error";
import { CmsReadError, readFailureResponse } from "@/lib/cms/server/strict-read";
import {
  MAX_ID_LENGTH,
  canonicalTarget,
  computeProductPatch,
  findAffectedProducts,
  isRemovalTarget,
  removeFromDocument,
  resolveReplacement,
  targetExists,
} from "@/lib/cms/taxonomy-removal";

export const dynamic = "force-dynamic";
export const revalidate = 0;
// Bulk product updates run in batches on the server.
export const maxDuration = 120;

const AUDIT_ACTION = "marketplace.filter_remove";

/**
 * Removes a taxonomy item. Affected products (any status, trash included) are
 * updated first, the document last, so a failure leaves the item visible and
 * the call can simply be repeated. A "started" audit record (with the previous
 * values) is written before any product changes; an outcome record follows.
 */
export async function POST(request: Request) {
  try {
    const auth = await cmsGuard("marketplace", "edit");
    if ("response" in auth) return auth.response;

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const rawReplacement = body?.replacementId;
    if (
      !body ||
      typeof body !== "object" ||
      !isRemovalTarget(body.target) ||
      (rawReplacement !== undefined &&
        (typeof rawReplacement !== "string" || rawReplacement.length > MAX_ID_LENGTH))
    ) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const target = canonicalTarget(body.target);
    const replacementId = rawReplacement as string | undefined;

    const audit = (details: Record<string, unknown>) =>
      addAuditLogDurable({
        userId: auth.user.id,
        userName: auth.user.name,
        action: AUDIT_ACTION,
        module: "marketplace",
        resourceId: target.id,
        details: JSON.stringify({
          target,
          replacementId: replacementId?.trim() || null,
          ...details,
        }),
      });
    const auditOutcome = async (details: Record<string, unknown>) => {
      try {
        await audit({ phase: "outcome", ...details });
      } catch (auditError) {
        console.error("filter removal outcome audit failed", auditError);
      }
    };

    const doc = await readMarketplaceFiltersStrict();
    if (target.kind === "option" && !doc.filterGroups.some((g) => g.id === target.groupId)) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    const products = await readProductsStrict();

    if (!targetExists(target, doc)) {
      // Lost-response retry: the removal already finished, so report success.
      if (findAffectedProducts(target, products, doc).length === 0) {
        // The earlier attempt may have died before busting the cache.
        invalidateCatalog();
        await auditOutcome({ status: "already_removed", updatedIds: [] });
        return NextResponse.json({ ok: true, updated: 0, failed: [] });
      }
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    const replacement = resolveReplacement(target, replacementId, doc);
    if (!replacement.ok) {
      return NextResponse.json({ error: replacement.error }, { status: 400 });
    }

    const affected = findAffectedProducts(target, products, doc);
    const updates = affected.map((product) => ({
      id: product.id,
      patch: computeProductPatch(target, product, replacement),
    }));

    const byId = new Map(affected.map((product) => [product.id, product]));
    try {
      await audit({
        phase: "started",
        productIds: updates.map((u) => u.id),
        previous: Object.fromEntries(
          updates.map(({ id, patch }) => [
            id,
            Object.fromEntries(
              Object.keys(patch).map((key) => [key, byId.get(id)?.[key as keyof typeof patch]])
            ),
          ])
        ),
      });
    } catch (auditError) {
      return publicApiError(auditError, "Could not record the audit trail; nothing was changed");
    }

    let result: Awaited<ReturnType<typeof updateProductReferences>> = { updated: [], failed: [] };
    try {
      if (updates.length) result = await updateProductReferences(updates);
    } catch (error) {
      await auditOutcome({ status: "partial", error: "product update threw", updatedIds: [] });
      return publicApiError(error, "Failed to remove item");
    }

    if (result.updated.length > 0) {
      invalidateProducts(
        result.updated.flatMap((id) => [id, byId.get(id)?.sku]),
        { catalog: false }
      );
      invalidateCatalog();
    }

    if (result.failed.length > 0) {
      console.error("filter removal: product updates failed", result.failed);
      await auditOutcome({
        status: "partial",
        updatedIds: result.updated,
        failedIds: result.failed.map((f) => f.id),
      });
      return NextResponse.json(
        {
          error: "Some products could not be updated",
          updated: result.updated.length,
          failed: result.failed.map((f) => f.id),
        },
        { status: 409 }
      );
    }

    try {
      // Re-read right before saving: an unrelated edit made while the products
      // were updating must survive, so apply the removal to a fresh copy.
      let fresh;
      try {
        fresh = await readMarketplaceFiltersStrict();
      } catch (error) {
        await auditOutcome({ status: "document_save_failed", updatedIds: result.updated });
        if (error instanceof CmsReadError) return readFailureResponse(error);
        return publicApiError(error, "Failed to remove item");
      }
      const stillValid = resolveReplacement(target, replacementId, fresh);
      if (!stillValid.ok) {
        await auditOutcome({
          status: "document_save_failed",
          updatedIds: result.updated,
          error: stillValid.error,
        });
        return NextResponse.json(
          { error: "The replacement was changed while removing. Review the filters and try again." },
          { status: 409 }
        );
      }
      await saveMarketplaceFilters(removeFromDocument(target, fresh));
    } catch (error) {
      await auditOutcome({ status: "document_save_failed", updatedIds: result.updated });
      return publicApiError(error, "Failed to remove item");
    }
    invalidateCatalog();
    await auditOutcome({ status: "completed", updatedIds: result.updated });

    return NextResponse.json({ ok: true, updated: result.updated.length, failed: [] });
  } catch (error) {
    if (error instanceof CmsReadError) return readFailureResponse(error);
    return publicApiError(error, "Failed to remove item");
  }
}
