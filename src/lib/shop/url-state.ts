import type {
  CurrencyCode,
  ShopFilters,
  SortOption,
  ViewMode,
} from "@/lib/shop/types";
import { EMPTY_SHOP_FILTERS } from "@/lib/shop/types";

export interface ShopUrlState {
  country: string | null;
  currency: CurrencyCode | null;
  q: string;
  sort: SortOption;
  view: ViewMode;
  filters: ShopFilters;
  product: string | null;
  cart: boolean;
  quote: boolean;
}

const SORT_VALUES: SortOption[] = [
  "relevance",
  "name_asc",
  "name_desc",
  "price_asc",
  "price_desc",
  "availability",
];

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value.split(",").filter(Boolean);
}

function parseNumber(value: string | null): number | null {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function parseShopUrlState(
  searchParams: URLSearchParams
): ShopUrlState {
  const sortParam = searchParams.get("sort");
  const viewParam = searchParams.get("view");

  return {
    country: searchParams.get("country"),
    currency: searchParams.get("currency") as CurrencyCode | null,
    q: searchParams.get("q") ?? "",
    sort: SORT_VALUES.includes(sortParam as SortOption)
      ? (sortParam as SortOption)
      : "relevance",
    view: viewParam === "list" ? "list" : "grid",
    filters: {
      ...EMPTY_SHOP_FILTERS,
      categoryId: searchParams.get("category"),
      subcategoryIds: parseList(searchParams.get("subcategory")),
      brandIds: parseList(searchParams.get("brand")),
      applications: parseList(searchParams.get("application")),
      cultures: parseList(searchParams.get("culture")),
      certifications: parseList(searchParams.get("certification")),
      countriesOfOrigin: parseList(searchParams.get("origin")),
      availabilityOnly: searchParams.get("available") === "1",
      priceMin: parseNumber(searchParams.get("priceMin")),
      priceMax: parseNumber(searchParams.get("priceMax")),
    },
    product: searchParams.get("product"),
    cart: searchParams.get("cart") === "open",
    quote: searchParams.get("quote") === "open",
  };
}

function setList(params: URLSearchParams, key: string, values: string[]) {
  if (values.length > 0) params.set(key, values.join(","));
  else params.delete(key);
}

export function buildShopSearchParams(state: {
  countryCode: string | null;
  currency: CurrencyCode | null;
  search: string;
  sort: SortOption;
  viewMode: ViewMode;
  filters: ShopFilters;
  quickViewProductId: string | null;
  isCartOpen: boolean;
  isQuoteModalOpen: boolean;
}): URLSearchParams {
  const params = new URLSearchParams();

  if (state.countryCode) params.set("country", state.countryCode);
  if (state.currency) params.set("currency", state.currency);
  if (state.search.trim()) params.set("q", state.search.trim());
  if (state.sort !== "relevance") params.set("sort", state.sort);
  if (state.viewMode === "list") params.set("view", "list");

  const { filters } = state;
  if (filters.categoryId) params.set("category", filters.categoryId);
  setList(params, "subcategory", filters.subcategoryIds);
  setList(params, "brand", filters.brandIds);
  setList(params, "application", filters.applications);
  setList(params, "culture", filters.cultures);
  setList(params, "certification", filters.certifications);
  setList(params, "origin", filters.countriesOfOrigin);
  if (filters.availabilityOnly) params.set("available", "1");
  if (filters.priceMin !== null) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax !== null) params.set("priceMax", String(filters.priceMax));

  if (state.quickViewProductId) params.set("product", state.quickViewProductId);
  if (state.isCartOpen) params.set("cart", "open");
  if (state.isQuoteModalOpen) params.set("quote", "open");

  return params;
}
