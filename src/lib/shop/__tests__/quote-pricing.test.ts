import { describe, expect, it } from "vitest";
import { summarizeQuoteLines } from "@/lib/shop/quote-pricing";

describe("summarizeQuoteLines", () => {
  it("estimated when every line is priced", () => {
    expect(summarizeQuoteLines([{ lineTotal: 10 }, { lineTotal: 5 }])).toEqual({
      pricedTotal: 15,
      pendingCount: 0,
      pricing: "estimated",
    });
  });
  it("mixed sums priced lines and counts pending", () => {
    expect(summarizeQuoteLines([{ lineTotal: 10 }, { lineTotal: null }])).toEqual({
      pricedTotal: 10,
      pendingCount: 1,
      pricing: "mixed",
    });
  });
  it("quote_only when all lines are pending", () => {
    expect(summarizeQuoteLines([{ lineTotal: null }])).toMatchObject({
      pricedTotal: 0,
      pricing: "quote_only",
    });
  });
});
