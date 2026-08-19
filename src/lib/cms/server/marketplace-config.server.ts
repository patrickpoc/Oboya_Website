import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { updateShopCatalog } from "@/lib/shop/catalog";
import type { ShopBrand, ShopCategory, ShopCountry, ShopFilterOptions, ShopProduct } from "@/lib/shop/types";

const CATEGORIES_FILE = path.join(process.cwd(), "data", "shop", "categories.json");
const BRANDS_FILE = path.join(process.cwd(), "data", "shop", "brands.json");
const FILTER_OPTIONS_FILE = path.join(process.cwd(), "data", "shop", "filter-options.json");
const COUNTRIES_FILE = path.join(process.cwd(), "data", "shop", "countries.json");
const PRODUCTS_FILE = path.join(process.cwd(), "data", "shop", "products.json");

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function writeJsonFile(filePath: string, data: unknown) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

export async function readMarketplaceFilters() {
  const [categories, brands, filterOptions] = await Promise.all([
    readJsonFile<ShopCategory[]>(CATEGORIES_FILE),
    readJsonFile<ShopBrand[]>(BRANDS_FILE),
    readJsonFile<ShopFilterOptions>(FILTER_OPTIONS_FILE),
  ]);
  return { categories, brands, filterOptions };
}

export async function saveMarketplaceFilters(payload: {
  categories: ShopCategory[];
  brands: ShopBrand[];
  filterOptions: ShopFilterOptions;
}) {
  await Promise.all([
    writeJsonFile(CATEGORIES_FILE, payload.categories),
    writeJsonFile(BRANDS_FILE, payload.brands),
    writeJsonFile(FILTER_OPTIONS_FILE, payload.filterOptions),
  ]);
  updateShopCatalog(payload);
  return payload;
}

function deriveCurrencies(countries: ShopCountry[], products: ShopProduct[]) {
  const set = new Set<string>();
  countries.forEach((country) => {
    country.currencies.forEach((currency) => set.add(currency));
    set.add(country.defaultCurrency);
  });
  products.forEach((product) => {
    Object.keys(product.prices ?? {}).forEach((code) => set.add(code));
  });
  return Array.from(set).sort();
}

export async function readMarketplaceCurrencies() {
  const [countries, products] = await Promise.all([
    readJsonFile<ShopCountry[]>(COUNTRIES_FILE),
    readJsonFile<ShopProduct[]>(PRODUCTS_FILE),
  ]);
  const currencies = deriveCurrencies(countries, products);
  return { countries, currencies };
}

export async function saveMarketplaceCurrencies(payload: {
  countries: ShopCountry[];
  currencies: string[];
}) {
  const products = await readJsonFile<ShopProduct[]>(PRODUCTS_FILE);
  const currencySet = new Set(payload.currencies);
  const normalizedProducts = products.map((product) => {
    const prices = { ...(product.prices ?? {}) } as Record<string, number>;
    Object.keys(prices).forEach((key) => {
      if (!currencySet.has(key)) delete prices[key];
    });
    payload.currencies.forEach((code) => {
      if (!(code in prices)) prices[code] = 0;
    });
    return { ...product, prices };
  });

  await Promise.all([
    writeJsonFile(COUNTRIES_FILE, payload.countries),
    writeJsonFile(PRODUCTS_FILE, normalizedProducts),
  ]);

  updateShopCatalog({ countries: payload.countries, products: normalizedProducts });
  return { countries: payload.countries, products: normalizedProducts };
}

