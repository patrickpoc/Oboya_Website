import { NextResponse } from "next/server";
import { readProductsStrict } from "@/lib/cms/server/products.server";
import { readMarketplaceFiltersStrict } from "@/lib/cms/server/marketplace-config.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { displayProductName } from "@/lib/cms/bulk-update/search-products";
import { findAffectedProducts, isRemovalTarget } from "@/lib/cms/taxonomy-removal";
import { noStoreHeaders } from "@/lib/security/http-cache";
import { publicApiError } from "@/lib/security/public-error";
import { CmsReadError, readFailureResponse } from "@/lib/cms/server/strict-read";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LIST_CAP = 200;

/** Products (any status, trash included) that reference one taxonomy item. */
export async function GET(request: Request) {
  const auth = await cmsGuard("marketplace", "view");
  if ("response" in auth) return auth.response;

  const params = new URL(request.url).searchParams;
  const target = {
    kind: params.get("kind"),
    id: params.get("id"),
    groupId: params.get("groupId") ?? undefined,
  };
  if (!isRemovalTarget(target)) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  try {
    const [filters, products] = await Promise.all([
      readMarketplaceFiltersStrict(),
      readProductsStrict(),
    ]);
    const affected = findAffectedProducts(target, products, filters);
    return NextResponse.json(
      {
        total: affected.length,
        products: affected.slice(0, LIST_CAP).map((product) => ({
          id: product.id,
          name: displayProductName(product),
          sku: product.sku,
          status: product.status,
          deleted: Boolean(product.deletedAt),
        })),
      },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    if (error instanceof CmsReadError) return readFailureResponse(error);
    return publicApiError(error, "Failed to load products");
  }
}
