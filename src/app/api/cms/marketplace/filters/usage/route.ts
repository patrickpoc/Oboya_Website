import { NextResponse } from "next/server";
import { readProductsStrict } from "@/lib/cms/server/products.server";
import { readMarketplaceFiltersStrict } from "@/lib/cms/server/marketplace-config.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import {
  countGroupUsage,
  countOptionUsage,
} from "@/lib/shop/filter-groups";
import { noStoreHeaders } from "@/lib/security/http-cache";
import { publicApiError } from "@/lib/security/public-error";
import { CmsReadError, readFailureResponse } from "@/lib/cms/server/strict-read";
import { productUsesTarget } from "@/lib/cms/taxonomy-removal";

/** Filter usage counts without shipping the product catalog to the client. */
export async function GET() {
  const auth = await cmsGuard("marketplace", "view");
  if ("response" in auth) return auth.response;

  try {
    const [filters, products] = await Promise.all([
      readMarketplaceFiltersStrict(),
      readProductsStrict(),
    ]);

    // Trashed products count too: restoring one must not leave a dangling reference.
    const active = products;
    const subcategoryUsage: Record<string, number> = {};
    const brandUsage: Record<string, number> = {};
    for (const product of active) {
      subcategoryUsage[product.subcategoryId] =
        (subcategoryUsage[product.subcategoryId] ?? 0) + 1;
      brandUsage[product.brandId] = (brandUsage[product.brandId] ?? 0) + 1;
    }
    // Same predicate as the removal flow: a product reached only through one
    // of the category's subcategories counts as well.
    const categoryUsage: Record<string, number> = {};
    for (const category of filters.categories) {
      const target = { kind: "category", id: category.id } as const;
      categoryUsage[category.id] = active.filter((product) =>
        productUsesTarget(target, product, filters)
      ).length;
    }

    const optionUsage: Record<string, Record<string, number>> = {};
    const groupUsage: Record<string, number> = {};
    for (const group of filters.filterGroups) {
      optionUsage[group.id] = {};
      for (const option of filters.filterOptions[group.id] ?? []) {
        optionUsage[group.id]![option.id] = countOptionUsage(
          group.id,
          option.id,
          active
        );
      }
      groupUsage[group.id] = countGroupUsage(group.id, active);
    }

    return NextResponse.json(
      { categoryUsage, subcategoryUsage, brandUsage, optionUsage, groupUsage },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    if (error instanceof CmsReadError) return readFailureResponse(error);
    return publicApiError(error, "Failed to load filter usage");
  }
}
