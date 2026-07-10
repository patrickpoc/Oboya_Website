import type {
  CurrencyCode,
  ShopFilters,
  ShopProduct,
  SortOption,
} from "@/lib/shop/types";

function matchesSearch(product: ShopProduct, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase().trim();
  const idAsWords = product.id.replace(/-/g, " ").toLowerCase();
  const qAsId = q.replace(/\s+/g, "-");
  return (
    product.id.toLowerCase().includes(q) ||
    product.id.toLowerCase().includes(qAsId) ||
    idAsWords.includes(q) ||
    product.sku.toLowerCase().includes(q) ||
    product.tags.some((tag) => tag.toLowerCase().includes(q)) ||
    product.categoryId.toLowerCase().includes(q)
  );
}

function matchesFilters(
  product: ShopProduct,
  filters: ShopFilters,
  countryCode: string | null
): boolean {
  if (filters.categoryId && product.categoryId !== filters.categoryId) {
    return false;
  }
  if (
    filters.subcategoryIds.length > 0 &&
    !filters.subcategoryIds.includes(product.subcategoryId)
  ) {
    return false;
  }
  if (
    filters.brandIds.length > 0 &&
    !filters.brandIds.includes(product.brandId)
  ) {
    return false;
  }
  if (
    filters.applications.length > 0 &&
    !filters.applications.some((id) => product.application.includes(id))
  ) {
    return false;
  }
  if (
    filters.cultures.length > 0 &&
    !filters.cultures.some((id) => product.cultures.includes(id))
  ) {
    return false;
  }
  if (
    filters.certifications.length > 0 &&
    !filters.certifications.some((id) => product.certifications.includes(id))
  ) {
    return false;
  }
  if (
    filters.countriesOfOrigin.length > 0 &&
    !filters.countriesOfOrigin.includes(product.countryOfOrigin)
  ) {
    return false;
  }
  if (filters.availabilityOnly && countryCode) {
    if (!product.availability[countryCode]) return false;
  }
  return true;
}

function matchesPriceRange(
  product: ShopProduct,
  currency: CurrencyCode | null,
  priceMin: number | null,
  priceMax: number | null
): boolean {
  if (!currency || (priceMin === null && priceMax === null)) return true;
  const price = product.prices[currency];
  if (price === undefined) return false;
  if (priceMin !== null && price < priceMin) return false;
  if (priceMax !== null && price > priceMax) return false;
  return true;
}

export function filterProducts(
  products: ShopProduct[],
  options: {
    countryCode: string | null;
    currency: CurrencyCode | null;
    search: string;
    filters: ShopFilters;
  }
): ShopProduct[] {
  const { countryCode, currency, search, filters } = options;

  return products.filter((product) => {
    if (countryCode && !product.availability[countryCode]) return false;
    if (!matchesSearch(product, search)) return false;
    if (!matchesFilters(product, filters, countryCode)) return false;
    if (!matchesPriceRange(product, currency, filters.priceMin, filters.priceMax)) {
      return false;
    }
    return true;
  });
}

export function sortProducts(
  products: ShopProduct[],
  sort: SortOption,
  currency: CurrencyCode | null
): ShopProduct[] {
  const list = [...products];

  switch (sort) {
    case "name_asc":
      return list.sort((a, b) => a.id.localeCompare(b.id));
    case "name_desc":
      return list.sort((a, b) => b.id.localeCompare(a.id));
    case "price_asc":
      return list.sort(
        (a, b) =>
          (a.prices[currency ?? "USD"] ?? 0) - (b.prices[currency ?? "USD"] ?? 0)
      );
    case "price_desc":
      return list.sort(
        (a, b) =>
          (b.prices[currency ?? "USD"] ?? 0) - (a.prices[currency ?? "USD"] ?? 0)
      );
    case "availability":
      return list.sort((a, b) => {
        const order = { in_stock: 0, limited: 1, on_request: 2 };
        return order[a.stockStatus] - order[b.stockStatus];
      });
    case "relevance":
    default:
      return list;
  }
}

export function countActiveFilters(filters: ShopFilters): number {
  let count = 0;
  if (filters.categoryId) count += 1;
  count += filters.subcategoryIds.length;
  count += filters.brandIds.length;
  count += filters.applications.length;
  count += filters.cultures.length;
  count += filters.certifications.length;
  count += filters.countriesOfOrigin.length;
  if (filters.availabilityOnly) count += 1;
  if (filters.priceMin !== null) count += 1;
  if (filters.priceMax !== null) count += 1;
  return count;
}
