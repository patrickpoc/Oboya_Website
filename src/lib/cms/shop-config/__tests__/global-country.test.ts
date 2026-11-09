import { describe, expect, it } from "vitest";
import { normalizeShopConfig } from "../defaults";

const code = (value: unknown, countries?: Parameters<typeof normalizeShopConfig>[1]) =>
  normalizeShopConfig({ market: { globalCountryCode: value } }, countries).market
    .globalCountryCode;

describe("normalizeShopConfig globalCountryCode", () => {
  it("normalizes valid, drops invalid", () => {
    expect(code("cn")).toBe("CN");
    expect(code(" br ")).toBe("BR");
    for (const bad of [undefined, null, 5, "china", "", "C1"]) expect(code(bad)).toBeNull();
  });

  it("keeps a code not in options.countries", () => {
    const countries = [{ code: "US", name: "US", currencies: ["USD"], defaultCurrency: "USD" }];
    expect(code("CN", { countries })).toBe("CN");
  });
});
