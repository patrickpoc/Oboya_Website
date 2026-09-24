import { NextResponse } from "next/server";
import { readProducts } from "@/lib/cms/server/products.server";
import { readMarketplaceFilters } from "@/lib/cms/server/marketplace-config.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import {
  countGroupUsage,
  countOptionUsage,
} from "@/lib/shop/filter-groups";
import { noStoreHeaders } from "@/lib/security/http-cache";

/** Filter usage counts without shipping the product catalog to the client. */
export async function GET() {
  const auth = await cmsGuard("marketplace", "view");
  if ("response" in auth) return auth.response;

  try {
    const [filters, products] = await Promise.all([
      readMarketplaceFilters(),
      readProducts({
        includeDeleted: false,
        fields: "table",
        skipPurge: true,
        asAdmin: true,
      }),
    ]);

    const active = products.filter((product) => !product.deletedAt);
    const categoryUsage: Record<string, number> = {};
    const brandUsage: Record<string, number> = {};
    for (const product of active) {
      categoryUsage[product.categoryId] =
        (categoryUsage[product.categoryId] ?? 0) + 1;
      brandUsage[product.brandId] = (brandUsage[product.brandId] ?? 0) + 1;
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
      { categoryUsage, brandUsage, optionUsage, groupUsage },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load filter usage";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
