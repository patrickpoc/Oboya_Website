import { describe, expect, it } from "vitest";
import {
  SALE_MODES,
  getCatalogPriceOrNull,
  getEffectiveSaleMode,
  isPricedLine,
  isUnavailableLine,
} from "@/lib/shop/sale-mode";
import { MAX_QUANTITY, getProductMaxQuantity } from "@/lib/shop/quantity";
import { filterProducts } from "@/lib/shop/filters";
import { parseShopUrlState } from "@/lib/shop/url-state";
import { EMPTY_SHOP_FILTERS, type ShopProduct } from "@/lib/shop/types";

function product(overrides: Partial<ShopProduct> = {}): ShopProduct {
  return {
    id: "sku-001",
    sku: "SKU-001",
    moq: 1,
    brandId: "oboya",
    categoryId: "pots",
    subcategoryId: "containers",
    images: [],
    imageColorIds: [],
    tags: [],
    availability: { BR: true },
    enabledCountries: { BR: true },
    prices: { BRL: 20 },
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

const base = { countryCode: "BR", currency: "BRL", search: "", filters: EMPTY_SHOP_FILTERS };
const ids = (list: ShopProduct[]) => list.map((p) => p.id);

describe("getEffectiveSaleMode", () => {
  it("exposes both modes", () => {
    expect(SALE_MODES).toEqual(["stock", "quote"]);
  });

  it.each([
    [{}, "stock"],
    [{ saleMode: "stock" as const }, "stock"],
    [{ saleMode: "quote" as const }, "quote"],
    [{ saleMode: "quote" as const, unlimitedStock: false, stockQuantity: 10 }, "quote"],
    [{ unlimitedStock: false, stockQuantity: 5 }, "stock"],
    [{ unlimitedStock: false, stockQuantity: 0 }, "quote"],
    [{ unlimitedStock: false, stockQuantity: null }, "quote"],
    [{ unlimitedStock: true, stockQuantity: 0 }, "stock"],
  ])("%j -> %s", (overrides, expected) => {
    expect(getEffectiveSaleMode(product(overrides))).toBe(expected);
  });
});

describe("isPricedLine / getCatalogPriceOrNull", () => {
  it("is priced only for stock with a positive price", () => {
    expect(isPricedLine(product(), null, "BRL")).toBe(true);
    expect(isPricedLine(product(), null, "USD")).toBe(false);
    expect(isPricedLine(product({ saleMode: "quote" }), null, "BRL")).toBe(false);
  });

  it("hides the catalog price for quote products", () => {
    expect(getCatalogPriceOrNull(product(), "BRL")).toBe(20);
    expect(getCatalogPriceOrNull(product({ saleMode: "quote" }), "BRL")).toBeNull();
  });
});

describe("visibility by sale mode", () => {
  it("hides stock products without a price in the currency", () => {
    expect(filterProducts([product()], { ...base, currency: "USD" })).toHaveLength(0);
  });

  it("shows quote products without a price", () => {
    const quote = product({ saleMode: "quote", prices: {} });
    expect(filterProducts([quote], base)).toHaveLength(1);
  });

  it("keeps zero-stock products visible as quote", () => {
    const empty = product({ unlimitedStock: false, stockQuantity: 0 });
    expect(filterProducts([empty], base)).toHaveLength(1);
  });

  it("hides both modes when the country is disabled", () => {
    const off = { BR: false };
    const list = [
      product({ enabledCountries: off, availability: off }),
      product({ id: "q", saleMode: "quote", enabledCountries: off, availability: off }),
    ];
    expect(filterProducts(list, base)).toHaveLength(0);
  });
});

describe("availability filter", () => {
  const list = [
    product({ id: "priced" }),
    product({ id: "quote", saleMode: "quote", prices: {} }),
    product({ id: "empty", unlimitedStock: false, stockQuantity: 0 }),
  ];
  const withAvailability = (availability: "priced" | "quote" | null) => ({
    ...base,
    filters: { ...EMPTY_SHOP_FILTERS, availability },
  });

  it("filters priced and quote", () => {
    expect(ids(filterProducts(list, withAvailability(null)))).toEqual(["priced", "quote", "empty"]);
    expect(ids(filterProducts(list, withAvailability("priced")))).toEqual(["priced"]);
    expect(ids(filterProducts(list, withAvailability("quote")))).toEqual(["quote", "empty"]);
  });

  it("maps legacy available=1 URLs to priced", () => {
    const parse = (v: string) =>
      parseShopUrlState(new URLSearchParams({ available: v })).filters.availability;
    expect(parse("1")).toBe("priced");
    expect(parse("priced")).toBe("priced");
    expect(parse("quote")).toBe("quote");
    expect(parse("x")).toBeNull();
  });
});

describe("isUnavailableLine / getProductMaxQuantity", () => {
  it("flags stock products without a price in the currency only", () => {
    expect(isUnavailableLine(product(), null, "USD")).toBe(true);
    expect(isUnavailableLine(product(), null, "BRL")).toBe(false);
    expect(isUnavailableLine(product({ saleMode: "quote" }), null, "USD")).toBe(false);
  });

  it("does not cap quote products by stock", () => {
    const quote = product({ saleMode: "quote", unlimitedStock: false, stockQuantity: 5 });
    expect(getProductMaxQuantity(quote)).toBe(MAX_QUANTITY);
    expect(getProductMaxQuantity({ ...quote, saleMode: "stock" })).toBe(5);
  });
});
