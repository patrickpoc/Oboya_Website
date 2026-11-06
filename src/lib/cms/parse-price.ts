/**
 * Locale-aware price parsing for bulk import/update.
 * BRL uses comma as decimal (0,47); USD/EUR use period (0.47).
 */

export type PriceCurrencyHint = "BRL" | "USD" | "EUR";

/** Incomplete input while typing (e.g. "0," or ".") — caller should keep draft. */
export const PRICE_INPUT_INCOMPLETE = Symbol("price-input-incomplete");

export type ParsePriceResult = number | null | typeof PRICE_INPUT_INCOMPLETE;

function stripCurrencyNoise(raw: string): string {
  return raw
    .trim()
    .replace(/\s/g, "")
    .replace(/^[R$€£¥]+/i, "")
    .replace(/[R$€£¥]+$/i, "");
}

/**
 * Parse a user/spreadsheet price string into a non-negative number.
 * Returns null for empty, NaN-equivalent invalid values as null when `strict` is false —
 * callers that need errors should check `Number.isFinite`.
 */
export function parsePriceInput(
  raw: string | null | undefined,
  hint: PriceCurrencyHint = "USD",
  options?: { allowIncomplete?: boolean }
): ParsePriceResult {
  const cleaned = stripCurrencyNoise(raw ?? "");
  if (!cleaned) return null;

  if (options?.allowIncomplete && /[.,]$/.test(cleaned)) {
    return PRICE_INPUT_INCOMPLETE;
  }

  let normalized = cleaned;

  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && hasDot) {
    // Both present: the last separator is the decimal one, the other is thousands.
    // 1,234.56 and 1.234,56 both -> 1234.56 (independent of currency hint).
    const decimal = normalized.lastIndexOf(",") > normalized.lastIndexOf(".") ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    if (normalized.split(decimal).length !== 2) return null;
    normalized = normalized.split(thousands).join("").replace(decimal, ".");
  } else if (hint === "BRL") {
    // 0,47 -> 0.47 | 0.47 also accepted
    if (hasComma) normalized = normalized.replace(",", ".");
  } else if (hasComma) {
    // USD / EUR: also accept European-style 0,47 as decimal when there is no period.
    if (/,\d{1,2}$/.test(normalized)) {
      normalized = normalized.replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }

  const num = Number(normalized);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

/** Format a stored number for display in an input matching currency conventions. */
export function formatPriceInput(
  value: number | null | undefined,
  hint: PriceCurrencyHint = "USD"
): string {
  if (value == null || !Number.isFinite(value)) return "";
  const fixed = Number.isInteger(value) ? String(value) : String(value);
  if (hint === "BRL") {
    return fixed.replace(".", ",");
  }
  return fixed;
}
