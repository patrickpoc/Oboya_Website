import { describe, expect, it } from "vitest";
import { filterProducts } from "@/lib/shop/filters";
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
