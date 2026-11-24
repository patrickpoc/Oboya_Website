import { describe, expect, it } from "vitest";
import { normalizeBoost, parseBoostInput } from "@/lib/shop/boost";

describe("normalizeBoost", () => {
  it("clamps, truncates and defaults to 0", () => {
    expect(normalizeBoost(50.9)).toBe(50);
    expect(normalizeBoost(150)).toBe(100);
    expect(normalizeBoost(-3)).toBe(0);
    for (const v of [undefined, null, "20", Number.NaN, Infinity, {}]) {
      expect(normalizeBoost(v)).toBe(0);
    }
  });
});

describe("parseBoostInput", () => {
  it("parses input strings", () => {
    expect(parseBoostInput("")).toBeNull();
    expect(parseBoostInput(" 30 ")).toBe(30);
    expect(parseBoostInput("0")).toBe(0);
    expect(parseBoostInput("100")).toBe(100);
    for (const v of ["101", "-1", "abc", "1.5"]) {
      expect(parseBoostInput(v)).toBeNaN();
    }
  });
});
