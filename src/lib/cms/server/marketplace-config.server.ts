import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  readCmsDocumentData,
  writeCmsDocumentData,
} from "@/lib/cms/server/cms-document.server";
import { invalidateProducts } from "@/lib/cms/server/cache-invalidation.server";
import { writeLocalJsonFile } from "@/lib/cms/server/local-fs.server";
import {
  readProductPricesStrict,
  updateProductPrices,
} from "@/lib/cms/server/products.server";
import { CmsReadError, readCmsDocumentStrict } from "@/lib/cms/server/strict-read";
import { updateShopCatalog } from "@/lib/shop/catalog";
import {
  normalizeBrands,
  normalizeCategories,
  normalizeFilterGroups,
  normalizeFilterOptions,
} from "@/lib/shop/filter-groups";
import type {
  ShopBrand,
  ShopCategory,
  ShopCountry,
  ShopFilterGroup,
  ShopFilterOptions,
  ShopProduct,
} from "@/lib/shop/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  DEFAULT_SHOP_CONFIG,
  normalizeShopConfig,
} from "@/lib/cms/shop-config/defaults";
import type { ShopConfig } from "@/lib/cms/shop-config/types";
import {
  filterActiveCountries,
  type StoreCountry,
} from "@/lib/cms/marketplace-countries";

const CATEGORIES_FILE = path.join(process.cwd(), "data", "shop", "categories.json");
const BRANDS_FILE = path.join(process.cwd(), "data", "shop", "brands.json");
const FILTER_OPTIONS_FILE = path.join(
  process.cwd(),
  "data",
  "shop",
  "filter-options.json"
);
const FILTER_GROUPS_FILE = path.join(
  process.cwd(),
  "data",
  "shop",
  "filter-groups.json"
);
const COUNTRIES_FILE = path.join(process.cwd(), "data", "shop", "countries.json");
const PRODUCTS_FILE = path.join(process.cwd(), "data", "shop", "products.json");
const SHOP_CONFIG_FILE = path.join(
  process.cwd(),
  "data",
  "cms",
  "marketplace-shop-config.json"
);

export const MARKETPLACE_FILTERS_DOC_ID = "marketplace-filters";
export const MARKETPLACE_CURRENCIES_DOC_ID = "marketplace-currencies";
export const MARKETPLACE_SHOP_CONFIG_DOC_ID = "marketplace-shop-config";

export type FiltersPayload = {
  categories: ShopCategory[];
  brands: ShopBrand[];
  filterGroups: ShopFilterGroup[];
  filterOptions: ShopFilterOptions;
};

type CurrenciesPayload = {
  countries: StoreCountry[];
  currencies: string[];
};

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function readJsonFileOptional<T>(filePath: string): Promise<T | null> {
  try {
    return await readJsonFile<T>(filePath);
  } catch {
    return null;
  }
}

function normalizeFiltersPayload(raw: {
  categories: ShopCategory[];
  brands: ShopBrand[];
  filterGroups?: ShopFilterGroup[];
  filterOptions: ShopFilterOptions;
}): FiltersPayload {
  const filterOptions = normalizeFilterOptions(raw.filterOptions, raw.filterGroups);
  const filterGroups = normalizeFilterGroups(raw.filterGroups, filterOptions);
  return {
    categories: normalizeCategories(raw.categories),
    brands: normalizeBrands(raw.brands),
    filterGroups,
    filterOptions: normalizeFilterOptions(filterOptions, filterGroups),
  };
}

function isFiltersPayload(value: unknown): value is {
  categories: ShopCategory[];
  brands: ShopBrand[];
  filterGroups?: ShopFilterGroup[];
  filterOptions: ShopFilterOptions;
} {
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
  const [categories, brands, filterOptions, filterGroups] = await Promise.all([
    readJsonFile<ShopCategory[]>(CATEGORIES_FILE),
    readJsonFile<ShopBrand[]>(BRANDS_FILE),
    readJsonFile<ShopFilterOptions>(FILTER_OPTIONS_FILE),
    readJsonFileOptional<ShopFilterGroup[]>(FILTER_GROUPS_FILE),
  ]);
  return normalizeFiltersPayload({
    categories,
    brands,
    filterGroups: filterGroups ?? undefined,
    filterOptions,
  });
}

export async function readMarketplaceFilters(): Promise<FiltersPayload> {
  const remote = await readCmsDocumentData(MARKETPLACE_FILTERS_DOC_ID);
  const payload = normalizeFiltersPayload(
    isFiltersPayload(remote) ? remote : await readFiltersSeed()
  );
  updateShopCatalog(payload);
  return payload;
}

/**
 * Baseline for write paths: authenticated client, never cached, and a failed
 * read throws instead of falling back to seed data. Seed is used only when
 * the document row is confirmed absent.
 */
export async function readMarketplaceFiltersStrict(): Promise<FiltersPayload> {
  const raw = await readCmsDocumentStrict(MARKETPLACE_FILTERS_DOC_ID);
  if (raw != null && !isFiltersPayload(raw)) {
    throw new CmsReadError("Marketplace filters document is malformed");
  }
  const payload = normalizeFiltersPayload(raw ?? (await readFiltersSeed()));
  updateShopCatalog(payload);
  return payload;
}

export async function saveMarketplaceFilters(
  payload: FiltersPayload
): Promise<FiltersPayload> {
  const normalized = normalizeFiltersPayload(payload);
  updateShopCatalog(normalized);

  if (isSupabaseConfigured()) {
    await writeCmsDocumentData(
      MARKETPLACE_FILTERS_DOC_ID,
      "marketplace",
      normalized
    );
    return normalized;
  }

  await Promise.all([
    writeLocalJsonFile(CATEGORIES_FILE, normalized.categories),
    writeLocalJsonFile(BRANDS_FILE, normalized.brands),
    writeLocalJsonFile(FILTER_OPTIONS_FILE, normalized.filterOptions),
    writeLocalJsonFile(FILTER_GROUPS_FILE, normalized.filterGroups),
  ]);
  return normalized;
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

/**
 * Reads store countries and the global currency list.
 * Public/store callers get active countries only; the admin passes
 * `includeInactive` to manage every configured country.
 */
export async function readMarketplaceCurrencies(
  options: { includeInactive?: boolean } = {}
): Promise<{ countries: StoreCountry[]; currencies: string[] }> {
  const remote = await readCmsDocumentData(MARKETPLACE_CURRENCIES_DOC_ID);
  const visible = (countries: StoreCountry[]) =>
    options.includeInactive ? countries : filterActiveCountries(countries);

  if (isCurrenciesPayload(remote)) {
    updateShopCatalog({ countries: filterActiveCountries(remote.countries) });
    return {
      countries: visible(remote.countries),
      currencies: remote.currencies.length
        ? remote.currencies
        : deriveCurrencies(remote.countries, []),
    };
  }

  const seed = await readCurrenciesSeed();
  const currencies = deriveCurrencies(seed.countries, seed.products);
  updateShopCatalog({
    countries: filterActiveCountries(seed.countries),
    products: seed.products,
  });
  return { countries: visible(seed.countries), currencies };
}

/** Save baseline for countries/currencies; throws instead of using seed on a failed read. */
export async function readMarketplaceCurrenciesStrict(
  options: { includeInactive?: boolean } = {}
): Promise<{ countries: StoreCountry[]; currencies: string[] }> {
  const remote = await readCmsDocumentStrict(MARKETPLACE_CURRENCIES_DOC_ID);
  if (remote != null) {
    if (!isCurrenciesPayload(remote)) {
      throw new CmsReadError("Marketplace currencies document is malformed");
    }
    updateShopCatalog({ countries: filterActiveCountries(remote.countries) });
    return {
      countries: options.includeInactive
        ? remote.countries
        : filterActiveCountries(remote.countries),
      currencies: remote.currencies.length
        ? remote.currencies
        : deriveCurrencies(remote.countries, []),
    };
  }
  // Confirmed absent: first save starts from the seed, as the public read does.
  const seed = await readCurrenciesSeed().catch((error) => {
    throw new CmsReadError(error);
  });
  updateShopCatalog({
    countries: filterActiveCountries(seed.countries),
    products: seed.products,
  });
  return {
    countries: options.includeInactive
      ? seed.countries
      : filterActiveCountries(seed.countries),
    currencies: deriveCurrencies(seed.countries, seed.products),
  };
}

export async function saveMarketplaceCurrencies(payload: {
  countries: StoreCountry[];
  currencies: string[];
}) {
  const currencySet = new Set(payload.currencies);

  const normalizePrices = <T extends { prices?: Partial<Record<string, number>> }>(
    product: T
  ): T => {
    const prices = { ...(product.prices ?? {}) } as Record<string, number>;
    Object.keys(prices).forEach((key) => {
      if (currencySet.has(key)) return;
      // Only zero prices may go: dropping a real price would be silent data loss.
      // The route guard rejects real removals; a stale non-zero key is kept and logged.
      if (prices[key]) {
        console.warn(`Keeping stale non-zero price for currency ${key}.`);
        return;
      }
      delete prices[key];
    });
    payload.currencies.forEach((code) => {
      if (!(code in prices)) prices[code] = 0;
    });
    return { ...product, prices };
  };

  if (isSupabaseConfigured()) {
    const started = Date.now();
    // Read every product first: a failed read must change nothing.
    const existing = await readProductPricesStrict();
    const changed = existing
      .map((product) => ({
        id: product.id,
        sku: product.sku,
        before: product.prices ?? {},
        prices: normalizePrices(product).prices ?? {},
      }))
      .filter((item) => JSON.stringify(item.before) !== JSON.stringify(item.prices));

    // Prices first, document last: a failure here leaves the document unchanged.
    // Prices only: other columns (description, ...) are never rewritten.
    const { updated, failed } = await updateProductPrices(
      changed.map(({ id, prices }) => ({ id, prices }))
    );
    const touched = new Set(updated);
    invalidateProducts(
      changed.filter((item) => touched.has(item.id)).flatMap((item) => [item.id, item.sku])
    );
    if (failed.length === 0) {
      await writeCmsDocumentData(MARKETPLACE_CURRENCIES_DOC_ID, "marketplace", {
        countries: payload.countries,
        currencies: payload.currencies,
      });
      updateShopCatalog({ countries: filterActiveCountries(payload.countries) });
    }

    const { logCmsPerf } = await import("@/lib/cms/server/perf-log.server");
    logCmsPerf("saveMarketplaceCurrencies", started, {
      upserted: updated.length,
      failed: failed.length,
      scanned: existing.length,
    });
    if (failed.length > 0) {
      throw new Error(
        `Currencies were not saved: prices could not be updated for ${failed.length} product(s). Save again to retry.`
      );
    }
    return { countries: payload.countries, productsTouched: updated.length };
  }

  const products = await readJsonFile<ShopProduct[]>(PRODUCTS_FILE);
  const normalizedProducts = products.map((product) =>
    normalizePrices(product)
  );

  await Promise.all([
    writeLocalJsonFile(COUNTRIES_FILE, payload.countries),
    writeLocalJsonFile(PRODUCTS_FILE, normalizedProducts),
  ]);

  updateShopCatalog({
    countries: filterActiveCountries(payload.countries),
    products: normalizedProducts,
  });
  return { countries: payload.countries, productsTouched: normalizedProducts.length };
}

/** Hydrate in-memory shop catalog from durable marketplace docs (or seed). */
export async function hydrateShopCatalogDurable() {
  const [filters, currencies] = await Promise.all([
    readMarketplaceFilters(),
    readMarketplaceCurrencies(),
  ]);
  updateShopCatalog({
    categories: filters.categories,
    brands: filters.brands,
    filterGroups: filters.filterGroups,
    filterOptions: filters.filterOptions,
    countries: currencies.countries,
  });
}

export async function readMarketplaceShopConfig(): Promise<ShopConfig> {
  const [remote, currencies] = await Promise.all([
    readCmsDocumentData(MARKETPLACE_SHOP_CONFIG_DOC_ID),
    readMarketplaceCurrencies().catch(() => null),
  ]);

  if (remote && typeof remote === "object") {
    return normalizeShopConfig(remote, {
      countries: currencies?.countries,
    });
  }

  const seed = await readJsonFileOptional<unknown>(SHOP_CONFIG_FILE);
  if (seed) {
    return normalizeShopConfig(seed, { countries: currencies?.countries });
  }

  return normalizeShopConfig(DEFAULT_SHOP_CONFIG, {
    countries: currencies?.countries,
  });
}

/**
 * Edit baseline for shop config: strict document, and the full country list
 * (inactive included) so a default market for an inactive country survives.
 * If the list is unreadable, countries are left out so nothing is cleared.
 */
async function strictCountriesForShopConfig(): Promise<StoreCountry[] | undefined> {
  try {
    return (await readMarketplaceCurrenciesStrict({ includeInactive: true })).countries;
  } catch (error) {
    if (error instanceof CmsReadError) return undefined;
    throw error;
  }
}

export async function readMarketplaceShopConfigStrict(): Promise<ShopConfig> {
  const remote = await readCmsDocumentStrict(MARKETPLACE_SHOP_CONFIG_DOC_ID);
  if (remote != null && (typeof remote !== "object" || Array.isArray(remote))) {
    throw new CmsReadError("Marketplace shop config document is malformed");
  }
  const countries = await strictCountriesForShopConfig();
  const source =
    remote ?? (await readJsonFileOptional<unknown>(SHOP_CONFIG_FILE)) ?? DEFAULT_SHOP_CONFIG;
  return normalizeShopConfig(source, { countries });
}

export async function saveMarketplaceShopConfig(
  payload: unknown
): Promise<ShopConfig> {
  const normalized = normalizeShopConfig(payload, {
    countries: await strictCountriesForShopConfig(),
  });

  if (isSupabaseConfigured()) {
    await writeCmsDocumentData(
      MARKETPLACE_SHOP_CONFIG_DOC_ID,
      "marketplace",
      normalized
    );
    return normalized;
  }

  await writeLocalJsonFile(SHOP_CONFIG_FILE, normalized);
  return normalized;
}
