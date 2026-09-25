import { describe, expect, it } from "vitest";
import {
  formatPriceInput,
  parsePriceInput,
  PRICE_INPUT_INCOMPLETE,
} from "@/lib/cms/parse-price";

describe("parsePriceInput", () => {
  it("parses BRL with comma decimals", () => {
    expect(parsePriceInput("0,47", "BRL")).toBe(0.47);
    expect(parsePriceInput("1.234,56", "BRL")).toBe(1234.56);
    expect(parsePriceInput("0.47", "BRL")).toBe(0.47);
  });

  it("parses USD/EUR with period decimals", () => {
    expect(parsePriceInput("0.47", "USD")).toBe(0.47);
    expect(parsePriceInput("1,234.56", "USD")).toBe(1234.56);
    expect(parsePriceInput("0,47", "EUR")).toBe(0.47);
  });

  it("handles empty and incomplete drafts", () => {
    expect(parsePriceInput("", "BRL")).toBeNull();
    expect(parsePriceInput("0,", "BRL", { allowIncomplete: true })).toBe(
      PRICE_INPUT_INCOMPLETE
    );
  });

  it("formats for currency display", () => {
    expect(formatPriceInput(0.47, "BRL")).toBe("0,47");
    expect(formatPriceInput(0.47, "USD")).toBe("0.47");
  });
});
