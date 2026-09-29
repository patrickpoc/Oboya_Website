import { NextResponse } from "next/server";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { readProductById } from "@/lib/cms/server/products.server";
import { cmsGuard, requireCmsAuth } from "@/lib/cms/server/require-cms-auth";
import { publicApiError } from "@/lib/security/public-error";
import { toPublicProduct } from "@/lib/cms/server/public-product";
import { noStoreHeaders } from "@/lib/security/http-cache";
import { shouldDeferRevalidate } from "@/lib/cms/revalidate-site";
import {
  deleteProductWrite,
  restoreProductWrite,
  writeProduct,
} from "@/lib/cms/server/product-writes.server";
import {
  pendingApprovalResponse,
  requiresApprovalFor,
  stripApprovalMeta,
  submitChangeRequest,
  submitOrApply,
  toPendingInfo,
} from "@/lib/cms/server/approvals.server";
import {
  diffJson,
  diffProductPrices,
  summarizeDiff,
  withPricesFrom,
} from "@/lib/cms/approvals/diff";
import type { ChangeRequest } from "@/lib/cms/approvals/types";
import { displayProductName } from "@/lib/cms/bulk-update/search-products";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function productLabel(product: Pick<CmsProduct, "sku" | "name" | "id">) {
  const name = displayProductName(product as CmsProduct);
  return [product.sku || product.id, name].filter(Boolean).join(" · ");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminAuth = await requireCmsAuth({ module: "marketplace", action: "view" });
    const asAdmin = adminAuth.ok;
    const product = await readProductById(id, { asAdmin });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (
      !asAdmin &&
      (product.status !== "published" || product.deletedAt)
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(asAdmin ? product : toPublicProduct(product), {
      headers: noStoreHeaders,
    });
  } catch (error) {
    return publicApiError(error, "Failed to load product");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await cmsGuard("marketplace", "edit");
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const body = stripApprovalMeta((await request.json()) as CmsProduct);
    if (body.id !== id) {
      return NextResponse.json({ error: "ID mismatch" }, { status: 400 });
    }
    const deferRevalidate = shouldDeferRevalidate(request);
    const previous = (await readProductById(id, { asAdmin: true })) ?? null;
    const label = productLabel(body);
    const pending: ChangeRequest[] = [];

    const priceDiff = diffProductPrices(previous, body);
    const holdPrice =
      Boolean(previous) &&
      priceDiff.changed &&
      (await requiresApprovalFor(auth.user, "marketplace.price"));

    if (holdPrice) {
      pending.push(
        await submitChangeRequest({
          user: auth.user,
          changeType: "marketplace.price",
          entityId: id,
          entityLabel: label,
          action: "update",
          payload: { productId: id, patch: priceDiff.proposed },
          snapshot: priceDiff.snapshot,
          diff: { entries: priceDiff.entries },
          summary: summarizeDiff(priceDiff.entries),
        })
      );
    }

    const freeBody = holdPrice ? withPricesFrom(body, previous) : body;
    const freeEntries = previous ? diffJson(previous, freeBody) : [];
    let saved: CmsProduct | null = null;

    if (!previous || freeEntries.length > 0) {
      const gate = await submitOrApply({
        user: auth.user,
        changeType: "marketplace.product_edit",
        entityId: id,
        entityLabel: label,
        action: "update",
        payload: { product: freeBody, preserveCurrentPrices: holdPrice },
        snapshot: previous,
        diff: { entries: freeEntries },
        summary: summarizeDiff(freeEntries),
        apply: () => writeProduct(freeBody, previous, { deferRevalidate }),
      });
      if (gate.applied) saved = gate.result;
      else pending.push(gate.request);
    }

    if (pending.length === 0) {
      return NextResponse.json(saved ?? previous ?? body);
    }

    const payload = {
      ...(saved ?? previous ?? body),
      pendingApproval: toPendingInfo(pending[0]!),
      pendingApprovals: pending.map(toPendingInfo),
    };
    return NextResponse.json(payload, { status: saved ? 200 : 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to persist product";
    const status = /exceeds|too many images/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await cmsGuard("marketplace", "delete");
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const deferRevalidate = shouldDeferRevalidate(request);
    const hardDelete = new URL(request.url).searchParams.get("hard") === "1";
    const existing = (await readProductById(id, { asAdmin: true })) ?? null;

    const gate = await submitOrApply({
      user: auth.user,
      changeType: "marketplace.product_delete",
      entityId: id,
      entityLabel: existing ? productLabel(existing) : id,
      action: "delete",
      payload: { productId: id, hard: hardDelete },
      snapshot: existing,
      diff: {
        entries: [
          {
            path: hardDelete ? "permanentDelete" : "deletedAt",
            before: existing?.deletedAt ?? null,
            after: hardDelete ? "permanent" : "trash",
          },
        ],
      },
      summary: hardDelete ? "Permanent delete" : "Move to trash",
      apply: () => deleteProductWrite(id, hardDelete, { deferRevalidate }),
    });
    if (!gate.applied) return pendingApprovalResponse(gate.request, { ok: false });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete product",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await cmsGuard("marketplace", "edit");
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const action = new URL(request.url).searchParams.get("action");

    if (action !== "restore") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    await restoreProductWrite(id, { deferRevalidate: shouldDeferRevalidate(request) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to restore product",
      },
      { status: 500 }
    );
  }
}
