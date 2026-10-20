import { describe, expect, it, vi } from "vitest";

vi.mock("@/../data/shop/product-id-remap.json", () => ({
  default: {
    generatedAt: "2026-01-01",
    products: { "produto-demo": "SKU-001" },
    variants: { "legacy-red": "SKU-001-RED" },
  },
}));

import { remapCartLine, remapProductId, remapVariantId } from "@/lib/shop/product-id-remap";

describe("product id remap", () => {
  it("rewrites a legacy product id to its SKU", () => {
    expect(remapProductId("produto-demo")).toBe("SKU-001");
  });

  it("rewrites a legacy variant id", () => {
    expect(remapVariantId("legacy-red")).toBe("SKU-001-RED");
  });

  it("leaves an id with no mapping unchanged", () => {
    expect(remapProductId("SKU-010")).toBe("SKU-010");
    expect(remapVariantId("unknown")).toBe("unknown");
    expect(remapVariantId(null)).toBeNull();
  });

  it("remaps a cart line", () => {
    expect(
      remapCartLine({ productId: "produto-demo", variantId: "legacy-red", quantity: 2 })
    ).toEqual({ productId: "SKU-001", variantId: "SKU-001-RED", quantity: 2 });
  });
});
