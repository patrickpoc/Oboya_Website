import type { CurrencyCode, ShopCountry } from "@/lib/shop/types";

/**
 * "All countries" lives in shop state as `countryCode: null` (the filters already
 * treat null as "no market gating"). The string below only exists at the edges:
 * the selector option, `?country=all` and the stored `countryCode: "all"` marker.
 */
export const ALL_COUNTRIES = "all";
/** Prices shown under All countries. */
export const ALL_COUNTRIES_CURRENCY: CurrencyCode = "USD";

export interface MarketSelection {
  /** null = All countries. Never the "all" sentinel. */
  countryCode: string | null;
  /** Always null under All countries. */
  currency: CurrencyCode | null;
  /** True when the visitor (URL, saved choice or selector) picked it, false for fallbacks. */
  explicit: boolean;
}

export interface MarketDefaults {
  defaultCountryCode: string | null;
  defaultCurrencyCode: CurrencyCode | null;
}

export function isExplicitAll(code: string | null | undefined): boolean {
  return typeof code === "string" && code.trim().toLowerCase() === ALL_COUNTRIES;
}

/** True for null/empty (nothing selected) and for the "all" sentinel. */
export function isAllCountries(code: string | null | undefined): boolean {
  return !code || isExplicitAll(code);
}

function findCountry(
  countries: ShopCountry[],
  code: string | null | undefined
): ShopCountry | undefined {
  if (typeof code !== "string" || !code.trim()) return undefined;
  const wanted = code.trim().toUpperCase();
  return countries.find((country) => country.code.toUpperCase() === wanted);
}

function pickCurrency(
  country: ShopCountry,
  ...candidates: Array<CurrencyCode | null | undefined>
): CurrencyCode {
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const match = country.currencies.find(
      (code) => code.toUpperCase() === candidate.trim().toUpperCase()
    );
    if (match) return match;
  }
  return country.defaultCurrency;
}

/**
 * Pure resolver for the shop market. Call it only once the active countries have loaded.
 * Order: URL, saved choice, admin default, All countries. An unknown or inactive
 * code counts as "nothing selected" and falls through to the next source. A currency
 * that is missing or not valid for the country falls back to the country default.
 */
export function resolveMarketSelection({
  urlCountry,
  urlCurrency,
  persisted,
  countries,
  marketDefaults,
}: {
  urlCountry?: string | null;
  urlCurrency?: CurrencyCode | null;
  persisted?: { countryCode: string | null; currency: CurrencyCode | null } | null;
  countries: ShopCountry[];
  marketDefaults?: MarketDefaults | null;
}): MarketSelection {
  const sources = [
    { code: urlCountry, currency: urlCurrency },
    { code: persisted?.countryCode, currency: persisted?.currency },
  ];
  for (const source of sources) {
    if (isExplicitAll(source.code)) {
      return { countryCode: null, currency: null, explicit: true };
    }
    const country = findCountry(countries, source.code);
    if (country) {
      return {
        countryCode: country.code,
        currency: pickCurrency(country, source.currency),
        explicit: true,
      };
    }
  }

  const fallback = findCountry(countries, marketDefaults?.defaultCountryCode);
  if (fallback) {
    return {
      countryCode: fallback.code,
      currency: pickCurrency(fallback, marketDefaults?.defaultCurrencyCode),
      explicit: false,
    };
  }
  return { countryCode: null, currency: null, explicit: false };
}

/** Selector/command input ("all", unknown code or a country) to the state to store. */
export function selectMarket(
  code: string,
  countries: ShopCountry[]
): MarketSelection {
  const country = findCountry(countries, code);
  if (!country) return { countryCode: null, currency: null, explicit: true };
  return {
    countryCode: country.code,
    currency: country.defaultCurrency,
    explicit: true,
  };
}

/** What to store in localStorage: an explicit All is kept as "all", a fallback All as null. */
export function toPersistedCountryCode(
  countryCode: string | null,
  explicit: boolean
): string | null {
  if (countryCode && !isExplicitAll(countryCode)) return countryCode;
  return explicit ? ALL_COUNTRIES : null;
}

/** Currency used to show prices: the market currency, or USD under All countries. */
export function getDisplayCurrency(
  countryCode: string | null,
  currency: CurrencyCode | null
): CurrencyCode | null {
  if (currency) return currency;
  return isAllCountries(countryCode) ? ALL_COUNTRIES_CURRENCY : null;
}

/** Market sent to the quote API. Null when no concrete country and currency is selected. */
export function getRfqMarket(
  countryCode: string | null,
  currency: CurrencyCode | null
): { countryCode: string; currency: CurrencyCode } | null {
  if (isAllCountries(countryCode) || !currency) return null;
  return { countryCode: countryCode as string, currency };
}

export interface MarketTransition extends MarketSelection {
  /** True when the quote list must be emptied (market changed or All countries). */
  clearItems: boolean;
}

/**
 * Market the state should move to once the API countries have loaded. `saved` is the
 * choice restored from storage before any URL was applied: an unknown URL country falls
 * through to it, and the quote list is kept when it stays in the market it belongs to.
 * Returns null when `loaded` is false (failed/offline fetch: never touch market or items).
 */
export function resolveMarketTransition({
  loaded,
  current,
  hasItems,
  saved,
  countries,
  marketDefaults,
}: {
  loaded: boolean;
  current: {
    countryCode: string | null;
    currency: CurrencyCode | null;
    explicit: boolean;
  };
  hasItems: boolean;
  saved?: { countryCode: string | null; currency: CurrencyCode | null } | null;
  countries: ShopCountry[];
  marketDefaults?: MarketDefaults | null;
}): MarketTransition | null {
  if (!loaded || countries.length === 0) return null;
  const next = resolveMarketSelection({
    urlCountry: current.countryCode ?? (current.explicit ? ALL_COUNTRIES : null),
    urlCurrency: current.currency,
    persisted: saved,
    countries,
    marketDefaults,
  });
  const itemsCountry =
    findCountry(countries, current.countryCode) ?? findCountry(countries, saved?.countryCode);
  const clearItems =
    hasItems &&
    (!next.countryCode ||
      next.countryCode.toUpperCase() !== itemsCountry?.code.toUpperCase());
  return { ...next, clearItems };
}
