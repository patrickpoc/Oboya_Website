import countriesData from "../../../data/shop/countries.json";
import {
  DEFAULT_FILTER_GROUPS,
  emptyShopFilterOptions,
  normalizeFilterGroups,
  normalizeFilterOptions,
} from "@/lib/shop/filter-groups";
import type { ShopCatalog, ShopCountry } from "@/lib/shop/types";

const emptyOptions = normalizeFilterOptions(emptyShopFilterOptions());

/**
 * Client bootstrap catalog. Taxonomy + products stay empty until
 * `/api/cms/marketplace/*` hydrates via `updateShopCatalog` — avoids flashing
 * stale local seed/demo filters (Categoria Demo, Teste Crop, etc.).
 * Countries remain available so the market picker works immediately.
 */
const catalog: ShopCatalog = {
  countries: countriesData as ShopCountry[],
  categories: [],
  brands: [],
  filterGroups: normalizeFilterGroups(DEFAULT_FILTER_GROUPS, emptyOptions),
  filterOptions: emptyOptions,
  products: [],
};

export function updateShopCatalog(patch: Partial<ShopCatalog>) {
  if (patch.countries) catalog.countries = patch.countries;
  if (patch.categories) catalog.categories = patch.categories;
  if (patch.brands) catalog.brands = patch.brands;
  if (patch.filterGroups) catalog.filterGroups = patch.filterGroups;
  if (patch.filterOptions) catalog.filterOptions = patch.filterOptions;
  if (patch.products) catalog.products = patch.products;
}

export function getShopCatalog(): ShopCatalog {
  return catalog;
}

export function getCountryByCode(code: string) {
  return catalog.countries.find((country) => country.code === code);
}

export function getProductById(id: string) {
  return catalog.products.find((product) => product.id === id);
}

export function getBrandById(id: string) {
  return catalog.brands.find((brand) => brand.id === id);
}

export function getCategoryById(id: string) {
  return catalog.categories.find((category) => category.id === id);
}

export function getAvailableProducts(countryCode: string) {
  return catalog.products.filter((product) => {
    const enabledMap = product.enabledCountries ?? product.availability;
    return Boolean(enabledMap[countryCode]);
  });
}

export function getProductsByIds(ids: string[]) {
  const set = new Set(ids);
  return catalog.products.filter((product) => set.has(product.id));
}

export const PRODUCTS_PAGE_SIZE = 24;
