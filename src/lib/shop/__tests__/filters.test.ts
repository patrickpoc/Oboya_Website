import { describe, expect, it } from "vitest";
import { filterProducts } from "@/lib/shop/filters";
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
    const products = [product(), product({ id: "sku-002", sku: "SKU-002", brandId: "other" })];
    expect(filterProducts(products, base)).toHaveLength(2);
  });

  it("combines category and brand", () => {
    const products = [
      product(),
      product({ id: "sku-002", sku: "SKU-002", brandId: "other" }),
      product({ id: "sku-003", sku: "SKU-003", categoryId: "trays" }),
    ];
    const result = filterProducts(products, {
      ...base,
      filters: { ...EMPTY_SHOP_FILTERS, categoryId: "pots", brandIds: ["oboya"] },
    });
    expect(result.map((item) => item.sku)).toEqual(["SKU-001"]);
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
