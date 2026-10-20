import { describe, expect, it } from "vitest";
import { clampQuantity, MAX_QUANTITY } from "@/lib/shop/quantity";

describe("clampQuantity", () => {
  it("lifts values below the minimum order quantity", () => {
    expect(clampQuantity(0, 12)).toBe(12);
    expect(clampQuantity(-4, 1)).toBe(1);
  });

  it("caps at MAX_QUANTITY", () => {
    expect(clampQuantity(MAX_QUANTITY + 50)).toBe(MAX_QUANTITY);
    expect(clampQuantity(10, 1, 4)).toBe(4);
  });

  it("rounds to the nearest integer", () => {
    expect(clampQuantity(1.4)).toBe(1);
    expect(clampQuantity(1.6)).toBe(2);
  });

  it("replaces invalid numbers with the minimum", () => {
    expect(clampQuantity(Number.NaN, 8)).toBe(8);
    expect(clampQuantity(Number.POSITIVE_INFINITY, 3)).toBe(3);
  });
});
