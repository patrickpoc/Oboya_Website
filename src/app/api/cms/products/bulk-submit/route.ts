import { NextResponse } from "next/server";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import {
  approvalErrorResponse,
  pendingApprovalResponse,
  requiresApprovalFor,
} from "@/lib/cms/server/approvals.server";
import { submitBulkUpdateRequest } from "@/lib/cms/server/bulk-approval.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 120;

/**
 * Bulk Update entry point. When the batch needs approval, the whole batch is
 * held as one change request; otherwise the client applies it as before.
 */
export async function POST(request: Request) {
  try {
    const auth = await cmsGuard("marketplace", "edit");
    if ("response" in auth) return auth.response;

    if (!(await requiresApprovalFor(auth.user, "marketplace.bulk_update"))) {
      return NextResponse.json({ approvalRequired: false });
    }

    const body = (await request.json()) as { products?: CmsProduct[] };
    const products = Array.isArray(body.products)
      ? body.products.filter((p) => p?.id && p?.sku)
      : [];
    if (products.length === 0) {
      return NextResponse.json({ error: "products array is required" }, { status: 400 });
    }

    const changeRequest = await submitBulkUpdateRequest(auth.user, products);
    return pendingApprovalResponse(changeRequest, { approvalRequired: true });
  } catch (error) {
    return approvalErrorResponse(error, "Failed to submit bulk update");
  }
}
