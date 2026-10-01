import { NextResponse } from "next/server";
import { readProducts } from "@/lib/cms/server/products.server";
import {
  readMarketplaceCurrencies,
  readMarketplaceFilters,
  readMarketplaceShopConfig,
} from "@/lib/cms/server/marketplace-config.server";
import { toPublicProduct } from "@/lib/cms/server/public-product";

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

  // Throwing keeps the previously cached response instead of caching an empty shop.
  if (published.length === 0) {
    throw new Error("shop/catalog: no published products");
  }

  return NextResponse.json({
    products: published,
    filters,
    currencies,
    shopConfig,
  });
}
