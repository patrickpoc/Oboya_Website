import { describe, expect, it } from "vitest";
import { formatShopPrice } from "@/lib/shop/format-price";

const currencies = ["USD", "BRL", "EUR", "GBP", "CNY", "MXN", "SEK", "NOK", "CAD", "AUD"];

describe("formatShopPrice", () => {
  it("formats each shop currency", () => {
    for (const currency of currencies) {
      const formatted = formatShopPrice(12.5, currency);
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted).toMatch(/12/);
    }
  });

  it("falls back for an unknown currency", () => {
    const formatted = formatShopPrice(9, "XYZ");
    expect(formatted).toMatch(/XYZ|9/);
  });

  it("treats a missing currency as USD", () => {
    expect(formatShopPrice(10, null)).toBe(formatShopPrice(10, "USD"));
  });
});
