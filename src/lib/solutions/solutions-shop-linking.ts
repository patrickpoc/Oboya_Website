import { getShopCatalog } from "@/lib/shop/catalog";
import { toPublicShopFilters } from "@/lib/shop/filter-groups";
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

function uniq(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).filter(Boolean))];
}

/** Merge crop + banner shop targets (union list filters; join `q`). */
export function mergeShopFilterTargets(
  ...targets: Array<ShopFilterTarget | null | undefined>
): ShopFilterTarget {
  const result: ShopFilterTarget = {};
  const qParts: string[] = [];

  for (const target of targets) {
    if (!target) continue;
    if (target.categoryId) result.categoryId = target.categoryId;
    result.subcategoryIds = uniq([
      ...(result.subcategoryIds ?? []),
      ...(target.subcategoryIds ?? []),
    ]);
    result.brandIds = uniq([...(result.brandIds ?? []), ...(target.brandIds ?? [])]);
    result.applications = uniq([
      ...(result.applications ?? []),
      ...(target.applications ?? []),
    ]);
    result.cultures = uniq([...(result.cultures ?? []), ...(target.cultures ?? [])]);
    result.certifications = uniq([
      ...(result.certifications ?? []),
      ...(target.certifications ?? []),
    ]);
    result.countriesOfOrigin = uniq([
      ...(result.countriesOfOrigin ?? []),
      ...(target.countriesOfOrigin ?? []),
    ]);
    if (target.q?.trim()) qParts.push(target.q.trim());
  }

  if (qParts.length > 0) result.q = qParts.join(" ");
  if (result.subcategoryIds?.length === 0) delete result.subcategoryIds;
  if (result.brandIds?.length === 0) delete result.brandIds;
  if (result.applications?.length === 0) delete result.applications;
  if (result.cultures?.length === 0) delete result.cultures;
  if (result.certifications?.length === 0) delete result.certifications;
  if (result.countriesOfOrigin?.length === 0) delete result.countriesOfOrigin;

  return result;
}

/**
 * Build a `/shop` deep-link from an explicit Solutions → Shop mapping.
 * Falls back to `/shop` (optionally with `q`) when taxonomy IDs are absent.
 * Uses stable public slugs when the live catalog is available.
 */
export function buildShopHrefForSolution(target?: ShopFilterTarget | null): string {
  if (!target) return "/shop";

  const search = (target.q ?? "").trim();
  const rawFilters = {
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

  const catalog = getShopCatalog();
  const filters = toPublicShopFilters(rawFilters, {
    categories: catalog.categories,
    brands: catalog.brands,
    filterOptions: catalog.filterOptions,
  });

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
