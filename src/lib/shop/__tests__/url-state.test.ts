import { describe, expect, it } from "vitest";
import { buildShopSearchParams, parseShopUrlState } from "@/lib/shop/url-state";

describe("shop url-state legacy brand param", () => {
  it("ignores ?brand= but keeps the other filters", () => {
    const state = parseShopUrlState(
      new URLSearchParams("brand=oboya-qs-ecovaso&culture=flowers")
    );
    expect(state.filters.cultures).toEqual(["flowers"]);
    expect(state.filters).not.toHaveProperty("brandIds");
  });

  it("drops brand when the URL is rebuilt", () => {
    const parsed = parseShopUrlState(
      new URLSearchParams("brand=oboya-qs-ecovaso&culture=flowers")
    );
    const params = buildShopSearchParams({
      countryCode: parsed.country,
      currency: parsed.currency,
      search: parsed.q,
      sort: parsed.sort,
      viewMode: parsed.view,
      filters: parsed.filters,
      quickViewProductId: null,
      isCartOpen: false,
      isQuoteModalOpen: false,
    });
    expect(params.has("brand")).toBe(false);
    expect(params.toString()).toContain("flowers");
  });
});
