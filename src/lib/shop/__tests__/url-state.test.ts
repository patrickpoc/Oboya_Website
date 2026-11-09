import { describe, expect, it } from "vitest";
import { buildShopSearchParams, parseShopUrlState } from "@/lib/shop/url-state";
import { EMPTY_SHOP_FILTERS } from "@/lib/shop/types";

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

function build(countryCode: string | null, currency: string | null) {
  return buildShopSearchParams({
    countryCode,
    currency,
    search: "",
    sort: "relevance",
    viewMode: "grid",
    filters: EMPTY_SHOP_FILTERS,
    quickViewProductId: null,
    isCartOpen: false,
    isQuoteModalOpen: false,
  });
}

describe("shop url-state All countries", () => {
  it("parses ?country=all (any case) as the all marker", () => {
    expect(parseShopUrlState(new URLSearchParams("country=all")).country).toBe("all");
    expect(parseShopUrlState(new URLSearchParams("country=ALL")).country).toBe("all");
  });

  it("still parses a concrete country and currency", () => {
    const state = parseShopUrlState(new URLSearchParams("country=BR&currency=BRL"));
    expect(state).toMatchObject({ country: "BR", currency: "BRL" });
  });

  it("writes no country or currency params for All countries", () => {
    expect(build(null, null).toString()).toBe("");
    expect(build("all", "USD").toString()).toBe("");
    expect(build(null, "USD").has("currency")).toBe(false);
  });

  it("round-trips: all -> clean URL, concrete country -> params", () => {
    const parsed = parseShopUrlState(new URLSearchParams("country=all"));
    expect(build(parsed.country, parsed.currency).toString()).toBe("");
    const br = parseShopUrlState(new URLSearchParams("country=BR&currency=BRL"));
    expect(build(br.country, br.currency).toString()).toBe("country=BR&currency=BRL");
  });
});
