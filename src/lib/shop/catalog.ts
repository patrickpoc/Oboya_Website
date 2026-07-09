import countriesData from "../../../data/shop/countries.json";
import categoriesData from "../../../data/shop/categories.json";
import brandsData from "../../../data/shop/brands.json";
import filterOptionsData from "../../../data/shop/filter-options.json";
import productsData from "../../../data/shop/products.json";
import type {
  ShopBrand,
  ShopCatalog,
  ShopCategory,
  ShopCountry,
  ShopFilterOptions,
  ShopProduct,
} from "@/lib/shop/types";

const catalog: ShopCatalog = {
  countries: countriesData as ShopCountry[],
  categories: categoriesData as ShopCategory[],
  brands: brandsData as ShopBrand[],
  filterOptions: filterOptionsData as ShopFilterOptions,
  products: productsData as ShopProduct[],
};

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
  return catalog.products.filter(
    (product) => product.availability[countryCode]
  );
}

export function getProductsByIds(ids: string[]) {
  const set = new Set(ids);
  return catalog.products.filter((product) => set.has(product.id));
}

export const PRODUCTS_PAGE_SIZE = 24;
