import { NextResponse } from "next/server";
import {
  getCmsProducts,
  saveCmsProduct,
  type CmsProduct,
} from "@/lib/cms/repositories/product-repository";
import {
  findExistingProduct,
  persistProductsToFileSafe,
  readProductById,
  saveProduct,
} from "@/lib/cms/server/products.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { validateColorVariants } from "@/lib/shop/color-variants";
import { displayProductName } from "@/lib/cms/bulk-update/search-products";
import type { BulkApplyResult } from "@/lib/cms/bulk-update/types";
import { BULK_UPDATE_MAX_PRODUCTS } from "@/lib/cms/bulk-update/types";
import { logCmsPerf } from "@/lib/cms/server/perf-log.server";
import {
  pendingApprovalResponse,
  requiresApprovalFor,
  submitChangeRequest,
  toPendingInfo,
} from "@/lib/cms/server/approvals.server";
import { submitBulkUpdateRequest } from "@/lib/cms/server/bulk-approval.server";
import { mergeProductUpdate } from "@/lib/cms/server/product-writes.server";
import { diffJson } from "@/lib/cms/approvals/diff";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BULK_CAP = BULK_UPDATE_MAX_PRODUCTS;

type BulkMode = "update" | "create";

type BulkBody = {
  mode?: BulkMode;
  products?: CmsProduct[];
};

/**
 * Batch create/update products in one request (single auth + one shop revalidate).
 */
export async function POST(request: Request) {
  const started = Date.now();
  try {
    const body = (await request.json()) as BulkBody;
    const mode: BulkMode = body.mode === "create" ? "create" : "update";
    const auth = await cmsGuard(
      "marketplace",
      mode === "create" ? "create" : "edit"
    );
    if ("response" in auth) return auth.response;

    const products = Array.isArray(body.products) ? body.products : [];
    if (products.length === 0) {
      return NextResponse.json(
        { error: "products array is required" },
        { status: 400 }
      );
    }
    if (products.length > BULK_CAP) {
      return NextResponse.json(
        {
          error: `At most ${BULK_CAP} products per bulk request`,
        },
        { status: 400 }
      );
    }

    const gateType = mode === "create" ? "marketplace.product_create" : "marketplace.bulk_update";
    if (await requiresApprovalFor(auth.user, gateType)) {
      if (mode === "update") {
        const changeRequest = await submitBulkUpdateRequest(
          auth.user,
          products.filter((p) => p?.id && p?.sku)
        );
        return pendingApprovalResponse(changeRequest, { results: [], ok: 0, failed: 0 });
      }
      const held = [];
      for (const product of products.filter((p) => p?.id && p?.sku)) {
        held.push(
          await submitChangeRequest({
            user: auth.user,
            changeType: "marketplace.product_create",
            entityId: product.id,
            entityLabel: [product.sku, displayProductName(product)].filter(Boolean).join(" · "),
            action: "create",
            payload: product,
            snapshot: null,
            diff: { entries: diffJson(null, product, "", [], 40) },
            summary: `New product ${product.sku}`,
          })
        );
      }
      return NextResponse.json(
        {
          results: [],
          ok: 0,
          failed: 0,
          pendingApproval: held[0] ? toPendingInfo(held[0]) : undefined,
          pendingApprovals: held.map(toPendingInfo),
        },
        { status: 202 }
      );
    }

    const { persistProductWithContent } = await import(
      "@/lib/cms/server/product-content.server"
    );

    const results: BulkApplyResult[] = [];
    let wroteAny = false;

    for (const product of products) {
      if (!product?.id || !product?.sku) {
        results.push({
          productId: product?.id ?? "",
          sku: product?.sku ?? "",
          name: product ? displayProductName(product) : "",
          status: "FAILED",
          error: "Product id and sku are required",
          suggestedAction: "Fix the product data and try again.",
        });
        continue;
      }

      const variantError = validateColorVariants(product.colorVariants, {
        defaultColor: product.defaultColor,
        defaultColorName: product.defaultColorName,
      });
      if (variantError && (product.colorVariants?.length ?? 0) > 0) {
        results.push({
          productId: product.id,
          sku: product.sku,
          name: displayProductName(product),
          status: "FAILED",
          error: variantError,
          field: "colorVariants",
          suggestedAction: "Fix color variant data and try again.",
        });
        continue;
      }

      try {
        const previous =
          mode === "update"
            ? await readProductById(product.id, { asAdmin: true })
            : null;
        if (mode === "create") {
          const existing = await findExistingProduct(product.id, product.sku);
          if (existing) {
            results.push({
              productId: product.id,
              sku: product.sku,
              name: displayProductName(product),
              status: "FAILED",
              error: `A product with SKU ${existing.sku || existing.id} already exists`,
              suggestedAction: "Use a different SKU or update the existing product.",
            });
            continue;
          }
        }
        if (mode === "update" && !previous) {
          results.push({
            productId: product.id,
            sku: product.sku,
            name: displayProductName(product),
            status: "FAILED",
            error: "Product not found",
            suggestedAction: "Refresh the catalog and try again.",
          });
          continue;
        }

        const saved = saveCmsProduct(
          await persistProductWithContent(mergeProductUpdate(product, previous), previous ?? undefined)
        );

        if (isSupabaseConfigured()) {
          await saveProduct(saved);
        }

        wroteAny = true;
        results.push({
          productId: saved.id,
          sku: saved.sku,
          name: displayProductName(saved),
          status: "SUCCESS",
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to persist product";
        results.push({
          productId: product.id,
          sku: product.sku,
          name: displayProductName(product),
          status: "FAILED",
          error: message,
          suggestedAction: "Fix the product data and try again.",
        });
      }
    }

    if (wroteAny) {
      await persistProductsToFileSafe(getCmsProducts({ includeDeleted: true }));
      try {
        const { revalidateShopPages } = await import(
          "@/lib/cms/revalidate-site"
        );
        revalidateShopPages();
      } catch {
        // Ignore when revalidation is unavailable.
      }
    }

    const ok = results.filter((r) => r.status === "SUCCESS").length;
    const failed = results.filter((r) => r.status === "FAILED").length;
    logCmsPerf("POST /api/cms/products/bulk", started, {
      mode,
      count: products.length,
      ok,
      failed,
    });

    return NextResponse.json({ results, ok, failed });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to bulk persist products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
