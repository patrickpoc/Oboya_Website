import { NextResponse } from "next/server";
import { readProducts } from "@/lib/cms/server/products.server";
import {
  readMarketplaceCurrencies,
  readMarketplaceFilters,
  readMarketplaceShopConfig,
} from "@/lib/cms/server/marketplace-config.server";
import { toPublicProduct } from "@/lib/cms/server/public-product";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Public shop bootstrap: products + taxonomy + currencies + shop config in one
 * cached response. Freshness comes from tag invalidation on CMS writes
 * (catalog / product / cms-doc tags); the TTL is only a safety net.
 * Must stay free of request-time APIs (cookies, headers, searchParams).
 */
export const dynamic = "force-static";
// Literal required by segment config; keep in sync with PUBLIC_DATA_REVALIDATE_SECONDS.
export const revalidate = 86400;

export async function GET() {
  const [products, filters, currencies, shopConfig] = await Promise.all([
    readProducts({ includeDeleted: false, fields: "list", skipPurge: true }),
    readMarketplaceFilters(),
    readMarketplaceCurrencies(),
    readMarketplaceShopConfig(),
  ]);

  const published = products
    .filter((product) => product.status === "published" && !product.deletedAt)
    .map(toPublicProduct);

  // A configured production catalog must not ship empty: the failed build keeps the
  // last good deploy. CI has no Supabase, and preview may have no products yet.
  if (
    published.length === 0 &&
    isSupabaseConfigured() &&
    process.env.VERCEL_ENV !== "preview"
  ) {
    throw new Error("shop/catalog: no published products");
  }

  return NextResponse.json({
    products: published,
    filters,
    currencies,
    shopConfig,
  });
}
