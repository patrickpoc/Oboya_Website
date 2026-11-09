import { describe, expect, it } from "vitest";
import { isGlobalMarket } from "@/lib/shop/global-market";

describe("isGlobalMarket", () => {
  it("matches case-insensitively", () => {
    expect(isGlobalMarket("us", "US")).toBe(true);
    expect(isGlobalMarket(" BR ", "br")).toBe(true);
  });
  it("is false for other codes or missing values", () => {
    expect(isGlobalMarket("BR", "US")).toBe(false);
    expect(isGlobalMarket("US", null)).toBe(false);
    expect(isGlobalMarket(null, "US")).toBe(false);
    expect(isGlobalMarket("US", "")).toBe(false);
  });
});
