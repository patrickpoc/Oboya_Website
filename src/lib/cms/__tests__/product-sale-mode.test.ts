import { describe, expect, it } from "vitest";
import { stockProductNeedsPrice } from "@/lib/cms/product-sale-mode";

const base = {
  saleMode: "stock" as const,
  status: "published" as const,
  enabledCountries: { BR: true },
  availability: {},
  prices: {},
  colorVariants: [],
};

describe("stockProductNeedsPrice", () => {
  it("flags published stock products without prices in enabled markets", () => {
    expect(stockProductNeedsPrice(base)).toBe(true);
  });
  it("ignores quote, drafts, no markets and priced products", () => {
    expect(stockProductNeedsPrice({ ...base, saleMode: "quote" })).toBe(false);
    expect(stockProductNeedsPrice({ ...base, status: "draft" })).toBe(false);
    expect(stockProductNeedsPrice({ ...base, enabledCountries: { BR: false } })).toBe(false);
    expect(stockProductNeedsPrice({ ...base, prices: { USD: 5 } })).toBe(false);
  });
});
