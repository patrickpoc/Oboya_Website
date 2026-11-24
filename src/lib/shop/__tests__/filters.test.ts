import { describe, expect, it } from "vitest";
import { filterProducts, sortProducts } from "@/lib/shop/filters";
import { EMPTY_SHOP_FILTERS, type ShopProduct } from "@/lib/shop/types";

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
    availability: { BR: true },
    enabledCountries: { BR: true },
    prices: { BRL: 20, USD: 4 },
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

const base = {
  countryCode: "BR",
  currency: "BRL",
  search: "",
  filters: EMPTY_SHOP_FILTERS,
};

describe("filterProducts", () => {
  it("keeps every visible product when no filter is set", () => {
    const products = [product(), product({ id: "sku-002", sku: "SKU-002", subcategoryId: "other" })];
    expect(filterProducts(products, base)).toHaveLength(2);
  });

  it("combines category and subcategory", () => {
    const products = [
      product(),
      product({ id: "sku-002", sku: "SKU-002", subcategoryId: "other" }),
      product({ id: "sku-003", sku: "SKU-003", categoryId: "trays" }),
    ];
    const result = filterProducts(products, {
      ...base,
      filters: {
        ...EMPTY_SHOP_FILTERS,
        categoryId: "pots",
        subcategoryIds: ["containers"],
      },
    });
    expect(result.map((item) => item.sku)).toEqual(["SKU-001"]);
  });

  it("ignores a legacy brandIds value", () => {
    const products = [product(), product({ id: "sku-002", sku: "SKU-002" })];
    const result = filterProducts(products, {
      ...base,
      filters: { ...EMPTY_SHOP_FILTERS, brandIds: ["nope"] } as typeof EMPTY_SHOP_FILTERS,
    });
    expect(result).toHaveLength(2);
  });

  it("drops products when the category id does not exist", () => {
    expect(
      filterProducts([product()], {
        ...base,
        filters: { ...EMPTY_SHOP_FILTERS, categoryId: "missing" },
      })
    ).toEqual([]);
  });
});

describe("filterProducts under All countries (null country and currency)", () => {
  const options = { countryCode: null, currency: null, search: "", filters: EMPTY_SHOP_FILTERS };

  it("returns every product, including ones enabled for no country and quote-only ones", () => {
    const products = [
      product(),
      product({ id: "none", sku: "NONE", enabledCountries: {}, availability: {}, prices: {} }),
      product({ id: "quote", sku: "Q", saleMode: "quote", prices: {} }),
    ];
    expect(filterProducts(products, options)).toHaveLength(3);
  });

  it("still filters by sale mode", () => {
    const products = [product(), product({ id: "quote", sku: "Q", saleMode: "quote", prices: {} })];
    const filters = (availability: "priced" | "quote") => ({
      ...options,
      filters: { ...EMPTY_SHOP_FILTERS, availability },
    });
    expect(filterProducts(products, filters("priced")).map((p) => p.id)).toEqual(["sku-001"]);
    expect(filterProducts(products, filters("quote")).map((p) => p.id)).toEqual(["quote"]);
  });
});

describe("sortProducts boost", () => {
  const ids = (l: ShopProduct[]) => l.map((p) => p.id);
  it("relevance puts higher boost first, stable on ties", () => {
    const list = [
      product({ id: "a" }),
      product({ id: "b", boost: 50 }),
      product({ id: "c", boost: 50 }),
      product({ id: "d", boost: 10 }),
      product({ id: "e", boost: 999 }),
      product({ id: "f", boost: -5 }),
    ];
    expect(ids(sortProducts(list, "relevance", "BRL"))).toEqual(["e", "b", "c", "d", "a", "f"]);
  });
  it("relevance key order: boost, single country, price shown, then stable", () => {
    const multi = { BR: true, MX: true };
    const list = [
      product({ id: "multi-priced", enabledCountries: multi }),
      product({ id: "single-quote", saleMode: "quote" }),
      product({ id: "single-noprice", prices: {} }),
      product({ id: "single-priced" }),
      product({ id: "multi-boost", enabledCountries: multi, boost: 1 }),
      product({ id: "single-priced2" }),
    ];
    expect(ids(sortProducts(list, "relevance", "BRL"))).toEqual([
      "multi-boost", "single-priced", "single-priced2", "single-quote", "single-noprice", "multi-priced",
    ]);
  });
  it("relevance: single country beats price shown; falls back to availability map", () => {
    const list = [
      product({ id: "multi-priced", enabledCountries: { BR: true, MX: true } }),
      product({ id: "single-quote", saleMode: "quote", enabledCountries: { BR: true, MX: false } }),
      product({ id: "legacy-single", enabledCountries: undefined, availability: { BR: true } }),
    ];
    expect(ids(sortProducts(list, "relevance", "BRL"))).toEqual(["legacy-single", "single-quote", "multi-priced"]);
  });
  it("keeps order when no boost", () => {
    const list = [product({ id: "a" }), product({ id: "b" })];
    expect(ids(sortProducts(list, "relevance", "BRL"))).toEqual(["a", "b"]);
  });
  it("price sort keeps groups and only tie-breaks by boost", () => {
    const list = [
      product({ id: "quote1", saleMode: "quote" }),
      product({ id: "quote2", saleMode: "quote", boost: 20 }),
      product({ id: "noprice", prices: {}, boost: 100 }),
      product({ id: "p20", prices: { BRL: 20 } }),
      product({ id: "p20b", prices: { BRL: 20 }, boost: 5 }),
      product({ id: "p10", prices: { BRL: 10 } }),
    ];
    expect(ids(sortProducts(list, "price_asc", "BRL"))).toEqual(["p10", "p20b", "p20", "noprice", "quote2", "quote1"]);
    expect(ids(sortProducts(list, "price_desc", "BRL"))).toEqual(["p20b", "p20", "p10", "noprice", "quote2", "quote1"]);
  });
  it("availability tie-breaks by boost", () => {
    const list = [
      product({ id: "a", stockStatus: "limited", boost: 1 }),
      product({ id: "b", stockStatus: "in_stock" }),
      product({ id: "c", stockStatus: "limited", boost: 9 }),
    ];
    expect(ids(sortProducts(list, "availability", "BRL"))).toEqual(["b", "c", "a"]);
  });
});
