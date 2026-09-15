import type {
  CurrencyCode,
  ShopFilters,
  SortOption,
  ViewMode,
} from "@/lib/shop/types";
import { EMPTY_SHOP_FILTERS } from "@/lib/shop/types";
import { BUILTIN_FILTER_GROUP_IDS } from "@/lib/shop/filter-groups";

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

/** Reserved query keys that are not custom filter-group params. */
const RESERVED_QUERY_KEYS = new Set([
  "country",
  "currency",
  "q",
  "sort",
  "view",
  "category",
  "subcategory",
  "brand",
  "application",
  "culture",
  "certification",
  "origin",
  "available",
  "priceMin",
  "priceMax",
  "product",
  "cart",
  "quote",
  ...BUILTIN_FILTER_GROUP_IDS,
]);

const BUILTIN_PARAM_BY_GROUP: Record<string, string> = {
  applications: "application",
  cultures: "culture",
  certifications: "certification",
  countriesOfOrigin: "origin",
};

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value.split(",").filter(Boolean);
}

function parseNumber(value: string | null): number | null {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function setList(params: URLSearchParams, key: string, values: string[]) {
  if (values.length > 0) params.set(key, values.join(","));
  else params.delete(key);
}

/** Custom groups use `fg.<groupId>=slug1,slug2` in the address bar. */
export function customFilterParamKey(groupId: string): string {
  return `fg.${groupId}`;
}

function parseCustomFilters(searchParams: URLSearchParams): Record<string, string[]> {
  const customFilters: Record<string, string[]> = {};
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith("fg.")) {
      const groupId = key.slice(3).trim();
      if (!groupId || RESERVED_QUERY_KEYS.has(groupId)) continue;
      customFilters[groupId] = parseList(value);
      continue;
    }
    // Forward-compatible: allow raw group ids that aren't reserved builtins.
    if (
      !RESERVED_QUERY_KEYS.has(key) &&
      !key.startsWith("fg.") &&
      value.includes(",") === false &&
      value.length > 0
    ) {
      // Prefer explicit fg.* ; ignore bare unknown keys to avoid catching typos.
    }
  }
  return customFilters;
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
      customFilters: parseCustomFilters(searchParams),
      availabilityOnly: searchParams.get("available") === "1",
      priceMin: parseNumber(searchParams.get("priceMin")),
      priceMax: parseNumber(searchParams.get("priceMax")),
    },
    product: searchParams.get("product"),
    cart: searchParams.get("cart") === "open",
    quote: searchParams.get("quote") === "open",
  };
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
  setList(params, BUILTIN_PARAM_BY_GROUP.applications, filters.applications);
  setList(params, BUILTIN_PARAM_BY_GROUP.cultures, filters.cultures);
  setList(params, BUILTIN_PARAM_BY_GROUP.certifications, filters.certifications);
  setList(
    params,
    BUILTIN_PARAM_BY_GROUP.countriesOfOrigin,
    filters.countriesOfOrigin
  );

  for (const [groupId, values] of Object.entries(filters.customFilters ?? {})) {
    if (BUILTIN_FILTER_GROUP_IDS.includes(groupId as (typeof BUILTIN_FILTER_GROUP_IDS)[number])) {
      continue;
    }
    setList(params, customFilterParamKey(groupId), values);
  }

  if (filters.availabilityOnly) params.set("available", "1");
  if (filters.priceMin !== null) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax !== null) params.set("priceMax", String(filters.priceMax));

  if (state.quickViewProductId) params.set("product", state.quickViewProductId);
  if (state.isCartOpen) params.set("cart", "open");
  if (state.isQuoteModalOpen) params.set("quote", "open");

  return params;
}
