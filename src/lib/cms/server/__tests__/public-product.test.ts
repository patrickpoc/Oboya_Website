import { describe, expect, it } from "vitest";
import { toPublicProduct } from "../public-product";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

const base = {
  id: "p1",
  prices: { USD: 10 },
  colorVariants: [{ id: "c1", prices: { USD: 12 } }],
} as unknown as CmsProduct;

describe("toPublicProduct", () => {
  it("strips prices for quote products", () => {
    const out = toPublicProduct({ ...base, saleMode: "quote" });
    expect(out.prices).toEqual({});
    expect(out.colorVariants?.[0].prices).toEqual({});
  });
  it("strips prices for effective quote products (no stock)", () => {
    const out = toPublicProduct({ ...base, saleMode: "stock", stockQuantity: 0, unlimitedStock: false });
    expect(out.prices).toEqual({});
  });
  it("keeps prices for stock products", () => {
    const out = toPublicProduct({ ...base, saleMode: "stock", stockQuantity: 5 });
    expect(out.prices).toEqual({ USD: 10 });
  });
});
