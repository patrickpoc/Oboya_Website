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

  it("parses mixed separators by the last separator, for any currency", () => {
    for (const hint of ["BRL", "USD", "EUR"] as const) {
      expect(parsePriceInput("1,234.56", hint)).toBe(1234.56);
      expect(parsePriceInput("1.234,56", hint)).toBe(1234.56);
      expect(parsePriceInput("1,234,567.89", hint)).toBe(1234567.89);
      expect(parsePriceInput("1.234.567,89", hint)).toBe(1234567.89);
    }
    expect(parsePriceInput("1,2,3.4", "USD")).toBe(123.4);
    expect(parsePriceInput("1,2.3,4", "USD")).toBeNull();
  });

  it("keeps single-separator forms unchanged", () => {
    expect(parsePriceInput("12.50", "USD")).toBe(12.5);
    expect(parsePriceInput("12,50", "BRL")).toBe(12.5);
    expect(parsePriceInput("12.50", "BRL")).toBe(12.5);
    expect(parsePriceInput("1,234", "USD")).toBe(1234);
    expect(parsePriceInput("1234", "EUR")).toBe(1234);
    expect(parsePriceInput("R$ 12,50", "BRL")).toBe(12.5);
    expect(parsePriceInput("abc", "USD")).toBeNull();
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
