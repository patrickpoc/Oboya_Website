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

  if (hint === "BRL") {
    // 1.234,56 → 1234.56 | 0,47 → 0.47 | 0.47 also accepted
    if (hasComma && hasDot) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else if (hasComma) {
      normalized = normalized.replace(",", ".");
    }
  } else {
    // USD / EUR: 1,234.56 → 1234.56 | 0.47 → 0.47
    // Also accept European-style 0,47 as decimal when there is no period.
    if (hasComma && hasDot) {
      normalized = normalized.replace(/,/g, "");
    } else if (hasComma && !hasDot) {
      if (/,\d{1,2}$/.test(normalized)) {
        normalized = normalized.replace(",", ".");
      } else {
        normalized = normalized.replace(/,/g, "");
      }
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
