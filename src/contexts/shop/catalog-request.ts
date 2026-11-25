import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { getShopCatalog } from "@/lib/shop/catalog";
import {
  normalizeColorVariants,
  normalizeImageColorIds,
  normalizeLocalizedColorName,
} from "@/lib/shop/color-variants";
import type { ShopProduct } from "@/lib/shop/types";

export type CatalogResponse = {
  products?: CmsProduct[];
  filters?: {
    categories?: ReturnType<typeof getShopCatalog>["categories"];
    filterGroups?: ReturnType<typeof getShopCatalog>["filterGroups"];
    filterOptions?: ReturnType<typeof getShopCatalog>["filterOptions"];
  };
  currencies?: {
    countries?: ReturnType<typeof getShopCatalog>["countries"];
  };
  shopConfig?: unknown;
};

/**
 * Edge-cached and tag-invalidated on CMS writes; a plain GET lets the CDN serve it.
 * Only a retry bypasses caches. Throws on any non-2xx response.
 */
export async function requestCatalog(
  fetchImpl: typeof fetch,
  retry: boolean
): Promise<CatalogResponse> {
  const res = await fetchImpl(
    "/api/shop/catalog",
    retry ? { cache: "no-store" } : undefined
  );
  if (!res.ok) throw new Error("Failed to load products");
  return (await res.json()) as CatalogResponse;
}

export function publishedProducts(products: CmsProduct[] = []): ShopProduct[] {
  return products
    .filter((product) => product.status === "published" && !product.deletedAt)
    .map((product) => ({
      ...product,
      defaultColor: product.defaultColor ?? "",
      defaultColorName: normalizeLocalizedColorName(product.defaultColorName),
      imageColorIds: normalizeImageColorIds(
        product.imageColorIds,
        (product.images ?? []).length
      ),
      colorVariants: normalizeColorVariants(product.colorVariants),
    }));
}
