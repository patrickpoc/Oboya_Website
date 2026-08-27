import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  readCmsDocumentData,
  writeCmsDocumentData,
} from "@/lib/cms/server/cms-document.server";
import { readProducts, saveProduct } from "@/lib/cms/server/products.server";
import { updateShopCatalog } from "@/lib/shop/catalog";
import type {
  ShopBrand,
  ShopCategory,
  ShopCountry,
  ShopFilterOptions,
  ShopProduct,
} from "@/lib/shop/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const CATEGORIES_FILE = path.join(process.cwd(), "data", "shop", "categories.json");
const BRANDS_FILE = path.join(process.cwd(), "data", "shop", "brands.json");
const FILTER_OPTIONS_FILE = path.join(
  process.cwd(),
  "data",
  "shop",
  "filter-options.json"
);
const COUNTRIES_FILE = path.join(process.cwd(), "data", "shop", "countries.json");
const PRODUCTS_FILE = path.join(process.cwd(), "data", "shop", "products.json");

export const MARKETPLACE_FILTERS_DOC_ID = "marketplace-filters";
export const MARKETPLACE_CURRENCIES_DOC_ID = "marketplace-currencies";

type FiltersPayload = {
  categories: ShopCategory[];
  brands: ShopBrand[];
  filterOptions: ShopFilterOptions;
};

type CurrenciesPayload = {
  countries: ShopCountry[];
  currencies: string[];
};

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function writeJsonFileSafe(filePath: string, data: unknown) {
  try {
    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  } catch (error) {
    if (
      error instanceof Error &&
      /EROFS|read-only file system|EACCES|ENOENT/i.test(error.message)
    ) {
      throw new Error(
        "Cannot write marketplace config on this host. Configure Supabase (cms_documents) for durable saves."
      );
    }
    throw error;
  }
}

function isFiltersPayload(value: unknown): value is FiltersPayload {
  if (!value || typeof value !== "object") return false;
  const doc = value as FiltersPayload;
  return (
    Array.isArray(doc.categories) &&
    Array.isArray(doc.brands) &&
    Boolean(doc.filterOptions) &&
    typeof doc.filterOptions === "object"
  );
}

function isCurrenciesPayload(value: unknown): value is CurrenciesPayload {
  if (!value || typeof value !== "object") return false;
  const doc = value as CurrenciesPayload;
  return Array.isArray(doc.countries) && Array.isArray(doc.currencies);
}

async function readFiltersSeed(): Promise<FiltersPayload> {
  const [categories, brands, filterOptions] = await Promise.all([
    readJsonFile<ShopCategory[]>(CATEGORIES_FILE),
    readJsonFile<ShopBrand[]>(BRANDS_FILE),
    readJsonFile<ShopFilterOptions>(FILTER_OPTIONS_FILE),
  ]);
  return { categories, brands, filterOptions };
}

export async function readMarketplaceFilters(): Promise<FiltersPayload> {
  const remote = await readCmsDocumentData(MARKETPLACE_FILTERS_DOC_ID);
  const payload = isFiltersPayload(remote) ? remote : await readFiltersSeed();
  updateShopCatalog(payload);
  return payload;
}

export async function saveMarketplaceFilters(
  payload: FiltersPayload
): Promise<FiltersPayload> {
  updateShopCatalog(payload);

  if (isSupabaseConfigured()) {
    await writeCmsDocumentData(
      MARKETPLACE_FILTERS_DOC_ID,
      "marketplace",
      payload
    );
    return payload;
  }

  await Promise.all([
    writeJsonFileSafe(CATEGORIES_FILE, payload.categories),
    writeJsonFileSafe(BRANDS_FILE, payload.brands),
    writeJsonFileSafe(FILTER_OPTIONS_FILE, payload.filterOptions),
  ]);
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

async function readCurrenciesSeed(): Promise<{
  countries: ShopCountry[];
  products: ShopProduct[];
}> {
  const [countries, products] = await Promise.all([
    readJsonFile<ShopCountry[]>(COUNTRIES_FILE),
    readJsonFile<ShopProduct[]>(PRODUCTS_FILE),
  ]);
  return { countries, products };
}

export async function readMarketplaceCurrencies() {
  const remote = await readCmsDocumentData(MARKETPLACE_CURRENCIES_DOC_ID);

  if (isCurrenciesPayload(remote)) {
    updateShopCatalog({ countries: remote.countries });
    return {
      countries: remote.countries,
      currencies: remote.currencies.length
        ? remote.currencies
        : deriveCurrencies(remote.countries, []),
    };
  }

  const seed = await readCurrenciesSeed();
  const currencies = deriveCurrencies(seed.countries, seed.products);
  updateShopCatalog({ countries: seed.countries, products: seed.products });
  return { countries: seed.countries, currencies };
}

export async function saveMarketplaceCurrencies(payload: {
  countries: ShopCountry[];
  currencies: string[];
}) {
  const currencySet = new Set(payload.currencies);

  const normalizePrices = <T extends { prices?: Partial<Record<string, number>> }>(
    product: T
  ): T => {
    const prices = { ...(product.prices ?? {}) } as Record<string, number>;
    Object.keys(prices).forEach((key) => {
      if (!currencySet.has(key)) delete prices[key];
    });
    payload.currencies.forEach((code) => {
      if (!(code in prices)) prices[code] = 0;
    });
    return { ...product, prices };
  };

  if (isSupabaseConfigured()) {
    await writeCmsDocumentData(MARKETPLACE_CURRENCIES_DOC_ID, "marketplace", {
      countries: payload.countries,
      currencies: payload.currencies,
    });

    const products = await readProducts({ includeDeleted: true });
    const normalizedProducts = products.map((product) =>
      normalizePrices(product)
    );
    await Promise.all(
      normalizedProducts.map((product) => saveProduct(product))
    );

    updateShopCatalog({ countries: payload.countries });
    return { countries: payload.countries, products: normalizedProducts };
  }

  const products = await readJsonFile<ShopProduct[]>(PRODUCTS_FILE);
  const normalizedProducts = products.map((product) =>
    normalizePrices(product)
  );

  await Promise.all([
    writeJsonFileSafe(COUNTRIES_FILE, payload.countries),
    writeJsonFileSafe(PRODUCTS_FILE, normalizedProducts),
  ]);

  updateShopCatalog({
    countries: payload.countries,
    products: normalizedProducts,
  });
  return { countries: payload.countries, products: normalizedProducts };
}
