import { buildShopSearchParams } from "@/lib/shop/url-state";
import { EMPTY_SHOP_FILTERS } from "@/lib/shop/types";
import type { ShopFilterTarget } from "@/lib/solutions/types";

function hasTaxonomy(target: ShopFilterTarget): boolean {
  return Boolean(
    target.categoryId ||
      (target.subcategoryIds && target.subcategoryIds.length > 0) ||
      (target.brandIds && target.brandIds.length > 0) ||
      (target.applications && target.applications.length > 0) ||
      (target.cultures && target.cultures.length > 0) ||
      (target.certifications && target.certifications.length > 0) ||
      (target.countriesOfOrigin && target.countriesOfOrigin.length > 0)
  );
}

/**
 * Build a `/shop` deep-link from an explicit Solutions → Shop mapping.
 * Falls back to `/shop` (optionally with `q`) when taxonomy IDs are absent.
 */
export function buildShopHrefForSolution(target?: ShopFilterTarget | null): string {
  if (!target) return "/shop";

  const search = (target.q ?? "").trim();
  const filters = {
    ...EMPTY_SHOP_FILTERS,
    categoryId: target.categoryId ?? null,
    subcategoryIds: target.subcategoryIds ?? [],
    brandIds: target.brandIds ?? [],
    applications: target.applications ?? [],
    cultures: target.cultures ?? [],
    certifications: target.certifications ?? [],
    countriesOfOrigin: target.countriesOfOrigin ?? [],
  };

  if (!hasTaxonomy(target) && !search) {
    return "/shop";
  }

  const params = buildShopSearchParams({
    countryCode: null,
    currency: null,
    search,
    sort: "relevance",
    viewMode: "grid",
    filters,
    quickViewProductId: null,
    isCartOpen: false,
    isQuoteModalOpen: false,
  });

  const query = params.toString();
  return query ? `/shop?${query}` : "/shop";
}
