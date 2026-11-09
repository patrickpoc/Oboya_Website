import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ALL_COUNTRIES,
  getDisplayCurrency,
  getRfqMarket,
  isAllCountries,
  resolveMarketSelection,
  resolveMarketTransition,
  selectMarket,
  toPersistedCountryCode,
} from "@/lib/shop/market";
import { filterProducts, sortProducts } from "@/lib/shop/filters";
import { loadPersisted, STORAGE_KEY } from "@/contexts/shop/model";
import { EMPTY_SHOP_FILTERS, type ShopCountry, type ShopProduct } from "@/lib/shop/types";

const countries: ShopCountry[] = [
  { code: "BR", name: "Brazil", currencies: ["BRL", "USD"], defaultCurrency: "BRL" },
  { code: "US", name: "United States", currencies: ["USD"], defaultCurrency: "USD" },
];
const noDefault = { defaultCountryCode: null, defaultCurrencyCode: null };
const brDefault = { defaultCountryCode: "BR", defaultCurrencyCode: "USD" };
const empty = { countryCode: null, currency: null };

const all = { countryCode: null, currency: null };

describe("resolveMarketSelection", () => {
  it("1. nothing selected and no admin default resolves to All countries", () => {
    expect(
      resolveMarketSelection({ countries, persisted: empty, marketDefaults: noDefault })
    ).toEqual({ ...all, explicit: false });
  });

  it("uses the admin default when nothing is selected", () => {
    expect(
      resolveMarketSelection({ countries, persisted: empty, marketDefaults: brDefault })
    ).toEqual({ countryCode: "BR", currency: "USD", explicit: false });
  });

  it("falls back to the country default currency when the admin currency does not fit", () => {
    expect(
      resolveMarketSelection({
        countries,
        marketDefaults: { defaultCountryCode: "BR", defaultCurrencyCode: "EUR" },
      })
    ).toMatchObject({ countryCode: "BR", currency: "BRL" });
  });

  it("2. a stale saved country resolves to the admin default, or All without one", () => {
    const persisted = { countryCode: "AR", currency: "ARS" };
    expect(resolveMarketSelection({ countries, persisted, marketDefaults: brDefault })).toMatchObject({
      countryCode: "BR",
    });
    expect(resolveMarketSelection({ countries, persisted, marketDefaults: noDefault })).toEqual({
      ...all,
      explicit: false,
    });
  });

  it("2. resolves again on every call (no one-shot state), so a cleared country is never stuck", () => {
    const first = resolveMarketSelection({ countries, persisted: empty, marketDefaults: noDefault });
    const second = resolveMarketSelection({
      countries,
      persisted: { countryCode: "AR", currency: null },
      marketDefaults: brDefault,
    });
    expect(first.countryCode).toBeNull();
    expect(second.countryCode).toBe("BR");
  });

  it("3. a country without currency gets that country's default currency", () => {
    expect(
      resolveMarketSelection({ urlCountry: "BR", urlCurrency: null, countries, marketDefaults: noDefault })
    ).toEqual({ countryCode: "BR", currency: "BRL", explicit: true });
    expect(
      resolveMarketSelection({ countries, persisted: { countryCode: "BR", currency: null }, marketDefaults: noDefault })
    ).toMatchObject({ countryCode: "BR", currency: "BRL" });
  });

  it("4. a currency that does not belong to the country is replaced", () => {
    expect(
      resolveMarketSelection({ urlCountry: "BR", urlCurrency: "XYZ", countries, marketDefaults: noDefault })
    ).toMatchObject({ countryCode: "BR", currency: "BRL" });
    expect(
      resolveMarketSelection({ urlCountry: "US", urlCurrency: "BRL", countries, marketDefaults: noDefault })
    ).toMatchObject({ countryCode: "US", currency: "USD" });
  });

  it("keeps a valid currency of the country", () => {
    expect(
      resolveMarketSelection({ urlCountry: "BR", urlCurrency: "USD", countries, marketDefaults: noDefault })
    ).toMatchObject({ currency: "USD" });
  });

  it("matches codes case-insensitively and returns the canonical code", () => {
    expect(
      resolveMarketSelection({ urlCountry: "br", urlCurrency: "usd", countries, marketDefaults: noDefault })
    ).toMatchObject({ countryCode: "BR", currency: "USD" });
  });

  it("5. an unknown URL country resolves to All, never to a blank state", () => {
    expect(
      resolveMarketSelection({ urlCountry: "ZZ", urlCurrency: "USD", countries, marketDefaults: noDefault })
    ).toEqual({ ...all, explicit: false });
  });

  it("an unknown URL country falls through to the saved country, then the default", () => {
    expect(
      resolveMarketSelection({
        urlCountry: "ZZ",
        persisted: { countryCode: "US", currency: "USD" },
        countries,
        marketDefaults: brDefault,
      })
    ).toMatchObject({ countryCode: "US" });
    expect(
      resolveMarketSelection({ urlCountry: "ZZ", countries, marketDefaults: brDefault })
    ).toMatchObject({ countryCode: "BR" });
  });

  it("the URL wins over the saved country", () => {
    expect(
      resolveMarketSelection({
        urlCountry: "US",
        persisted: { countryCode: "BR", currency: "BRL" },
        countries,
        marketDefaults: noDefault,
      })
    ).toMatchObject({ countryCode: "US", currency: "USD" });
  });

  it("an explicit all (URL or saved) is All and beats the admin default", () => {
    expect(
      resolveMarketSelection({ urlCountry: "all", countries, marketDefaults: brDefault })
    ).toEqual({ ...all, explicit: true });
    expect(
      resolveMarketSelection({
        persisted: { countryCode: ALL_COUNTRIES, currency: "BRL" },
        countries,
        marketDefaults: brDefault,
      })
    ).toEqual({ ...all, explicit: true });
    expect(
      resolveMarketSelection({ urlCountry: "ALL", countries, marketDefaults: brDefault }).countryCode
    ).toBeNull();
  });

  it("an admin default that is not an active country resolves to All", () => {
    expect(
      resolveMarketSelection({
        countries,
        marketDefaults: { defaultCountryCode: "AR", defaultCurrencyCode: "ARS" },
      })
    ).toEqual({ ...all, explicit: false });
  });

  it("never returns the all sentinel as a country code", () => {
    for (const urlCountry of ["all", "ALL", " all ", "ZZ", null, ""]) {
      const result = resolveMarketSelection({ urlCountry, countries, marketDefaults: noDefault });
      expect(result.countryCode).not.toBe(ALL_COUNTRIES);
    }
  });
});

describe("selectMarket (setCountry)", () => {
  it("selects a country with its default currency", () => {
    expect(selectMarket("BR", countries)).toEqual({ countryCode: "BR", currency: "BRL", explicit: true });
  });

  it("all and unknown codes select All countries with no currency", () => {
    expect(selectMarket("all", countries)).toEqual({ ...all, explicit: true });
    expect(selectMarket("ZZ", countries)).toEqual({ ...all, explicit: true });
    expect(selectMarket("", countries)).toEqual({ ...all, explicit: true });
  });
});

describe("persisted market", () => {
  it("stores an explicit All as 'all' and a fallback All as null", () => {
    expect(toPersistedCountryCode(null, true)).toBe("all");
    expect(toPersistedCountryCode(null, false)).toBeNull();
    expect(toPersistedCountryCode("BR", false)).toBe("BR");
    expect(toPersistedCountryCode("BR", true)).toBe("BR");
  });

  describe("loadPersisted", () => {
    afterEach(() => vi.unstubAllGlobals());

    function stubStorage(value: unknown) {
      const store: Record<string, string> = {};
      if (value !== undefined) {
        store[STORAGE_KEY] = typeof value === "string" ? value : JSON.stringify(value);
      }
      vi.stubGlobal("window", {});
      vi.stubGlobal("localStorage", { getItem: (key: string) => store[key] ?? null });
    }

    it("keeps 'all' as the explicit marker", () => {
      stubStorage({ countryCode: "all", currency: null, items: [] });
      expect(loadPersisted().countryCode).toBe("all");
      stubStorage({ countryCode: " ALL ", currency: "BRL", items: [] });
      expect(loadPersisted().countryCode).toBe("all");
    });

    it("keeps older values working", () => {
      stubStorage({ countryCode: "BR", currency: "BRL", items: [{ productId: "p", quantity: 2 }] });
      const persisted = loadPersisted();
      expect(persisted).toMatchObject({ countryCode: "BR", currency: "BRL" });
      expect(persisted.items).toHaveLength(1);
    });

    it("older entries with a country but no currency still load", () => {
      stubStorage({ countryCode: "BR", currency: null, items: [] });
      expect(loadPersisted()).toMatchObject({ countryCode: "BR", currency: null });
    });

    it("ignores missing, malformed or wrongly typed values", () => {
      stubStorage(undefined);
      expect(loadPersisted()).toEqual({ countryCode: null, currency: null, items: [] });
      stubStorage("{not json");
      expect(loadPersisted().countryCode).toBeNull();
      stubStorage({ countryCode: 12, currency: {}, items: "x" });
      expect(loadPersisted()).toEqual({ countryCode: null, currency: null, items: [] });
    });
  });
});

describe("quote API market", () => {
  it("never produces a market for All countries", () => {
    expect(getRfqMarket(null, null)).toBeNull();
    expect(getRfqMarket(null, "USD")).toBeNull();
    expect(getRfqMarket("all", "USD")).toBeNull();
    expect(getRfqMarket("ALL", "USD")).toBeNull();
    expect(getRfqMarket("BR", null)).toBeNull();
  });

  it("passes a concrete country and currency", () => {
    expect(getRfqMarket("BR", "BRL")).toEqual({ countryCode: "BR", currency: "BRL" });
  });

  it("every resolver/selector output either has a concrete country or no RFQ market", () => {
    const outputs = [
      resolveMarketSelection({ urlCountry: "all", countries, marketDefaults: brDefault }),
      resolveMarketSelection({ urlCountry: "ZZ", countries, marketDefaults: noDefault }),
      selectMarket("all", countries),
      selectMarket("ZZ", countries),
    ];
    for (const out of outputs) {
      expect(getRfqMarket(out.countryCode, out.currency)).toBeNull();
      expect(out.countryCode).not.toBe("all");
    }
  });
});

describe("display currency", () => {
  it("uses USD under All countries and the market currency otherwise", () => {
    expect(getDisplayCurrency(null, null)).toBe("USD");
    expect(getDisplayCurrency("BR", "BRL")).toBe("BRL");
    expect(getDisplayCurrency("BR", null)).toBeNull();
    expect(isAllCountries(null)).toBe(true);
    expect(isAllCountries("all")).toBe(true);
    expect(isAllCountries("BR")).toBe(false);
  });
});

function product(overrides: Partial<ShopProduct> = {}): ShopProduct {
  return {
    id: "sku-001",
    sku: "SKU-001",
    moq: 1,
    categoryId: "pots",
    subcategoryId: "containers",
    images: [],
    imageColorIds: [],
    tags: [],
    availability: {},
    enabledCountries: {},
    prices: {},
    application: [],
    cultures: [],
    certifications: [],
    countryOfOrigin: "BR",
    stockStatus: "in_stock",
    stockQuantity: null,
    unlimitedStock: true,
    specs: [],
    documents: [],
    relatedProductIds: [],
    defaultColor: "",
    defaultColorName: { en: "" },
    colorVariants: [],
    ...overrides,
  };
}

describe("a first-time visitor never sees a blank shop (resolver + real filters)", () => {
  const products = [
    product({ id: "a", sku: "A", prices: { USD: 5, BRL: 25 }, enabledCountries: { BR: true, US: true } }),
    product({ id: "b", sku: "B", prices: { BRL: 9 }, enabledCountries: {} }),
    product({ id: "c", sku: "C", prices: {}, saleMode: "quote" }),
  ];

  it("scenario 1: clean storage, no default lists every published product", () => {
    const market = resolveMarketSelection({ countries, persisted: empty, marketDefaults: noDefault });
    const visible = filterProducts(products, {
      countryCode: market.countryCode,
      currency: market.currency,
      search: "",
      filters: EMPTY_SHOP_FILTERS,
    });
    expect(visible.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("scenarios 2-5: every invalid input resolves to a market that lists products", () => {
    const inputs = [
      { urlCountry: "ZZ" },
      { urlCountry: "BR", urlCurrency: "XYZ" },
      { urlCountry: "BR" },
      { persisted: { countryCode: "AR", currency: "ARS" } },
      { persisted: { countryCode: "BR", currency: null } },
    ];
    for (const input of inputs) {
      const market = resolveMarketSelection({ countries, marketDefaults: noDefault, ...input });
      const visible = filterProducts(products, {
        countryCode: market.countryCode,
        currency: market.currency,
        search: "",
        filters: EMPTY_SHOP_FILTERS,
      });
      expect(visible.length, JSON.stringify(input)).toBeGreaterThan(0);
    }
  });

  it("scenario 6: a valid country with nothing enabled stays empty (data, not a bug), All is the way out", () => {
    const onlyBr = [products[0]!].map((p) => ({ ...p, enabledCountries: { BR: true } }));
    const options = { search: "", filters: EMPTY_SHOP_FILTERS };
    const us = resolveMarketSelection({ urlCountry: "US", countries, marketDefaults: noDefault });
    expect(filterProducts(onlyBr, { ...options, countryCode: us.countryCode, currency: us.currency })).toHaveLength(0);
    expect(filterProducts(onlyBr, { ...options, countryCode: null, currency: null })).toHaveLength(1);
  });
});

describe("price sort under All countries (USD, unpriced last)", () => {
  const list = [
    product({ id: "none", sku: "NONE", prices: { BRL: 1 } }),
    product({ id: "quote", sku: "Q", prices: {}, saleMode: "quote" }),
    product({ id: "high", sku: "H", prices: { USD: 9 } }),
    product({ id: "low", sku: "L", prices: { USD: 2 } }),
  ];
  const ids = (sort: "price_asc" | "price_desc") =>
    sortProducts(list, sort, "USD").map((p) => p.id);

  it("ascending: priced low to high, then no USD price, then On Demand", () => {
    expect(ids("price_asc")).toEqual(["low", "high", "none", "quote"]);
  });

  it("descending keeps the unpriced products last", () => {
    expect(ids("price_desc")).toEqual(["high", "low", "none", "quote"]);
  });

  it("a null currency sorts by USD", () => {
    expect(sortProducts(list, "price_asc", null).map((p) => p.id)).toEqual(ids("price_asc"));
  });
});

describe("resolveMarketTransition", () => {
  const saved = { countryCode: "MX", currency: "MXN" as const };
  const mx: ShopCountry = { code: "MX", name: "Mexico", currencies: ["MXN"], defaultCurrency: "MXN" };
  const base = {
    current: { countryCode: "MX", currency: "MXN" as const, explicit: true },
    hasItems: true,
    saved,
    countries,
    marketDefaults: noDefault,
  };

  it("a failed or offline load (countries not loaded) changes nothing", () => {
    expect(resolveMarketTransition({ ...base, loaded: false })).toBeNull();
  });

  it("once loaded, a saved country the API dropped resolves to All and clears items", () => {
    expect(resolveMarketTransition({ ...base, loaded: true })).toMatchObject({
      countryCode: null,
      clearItems: true,
    });
  });

  it("keeps items when the saved country is active", () => {
    expect(
      resolveMarketTransition({ ...base, loaded: true, countries: [...countries, mx] })
    ).toMatchObject({ countryCode: "MX", clearItems: false });
  });

  it("an unknown URL country falls through to the saved country and keeps items", () => {
    expect(
      resolveMarketTransition({
        ...base,
        loaded: true,
        countries: [...countries, mx],
        current: { countryCode: "ZZ", currency: null, explicit: true },
      })
    ).toMatchObject({ countryCode: "MX", currency: "MXN", clearItems: false });
  });
});
