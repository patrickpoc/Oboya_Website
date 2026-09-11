import type { CurrencyCode } from "@/lib/shop/types";

/**
 * Locale used for number punctuation (thousands / decimal) per currency.
 * Keeps BRL as 1.234,56, USD as 1,234.56, EUR as 1.234,56, etc.
 */
const CURRENCY_FORMAT_LOCALES: Record<string, string> = {
  USD: "en-US",
  BRL: "pt-BR",
  EUR: "de-DE",
  GBP: "en-GB",
  CNY: "zh-CN",
  MXN: "es-MX",
  SEK: "sv-SE",
  NOK: "nb-NO",
  CAD: "en-CA",
  AUD: "en-AU",
};

const SHOP_PRICE_MAX_DECIMALS = 3;
const SHOP_PRICE_MIN_DECIMALS = 2;

/**
 * Show 3 decimal places only when the thousandths digit is non-zero.
 * e.g. 2.930 → 2 digits, 2.876 → 3 digits.
 */
function getShopFractionDigits(amount: number): number {
  const scaled = Math.round(Math.abs(amount) * 10 ** SHOP_PRICE_MAX_DECIMALS);
  return scaled % 10 === 0 ? SHOP_PRICE_MIN_DECIMALS : SHOP_PRICE_MAX_DECIMALS;
}

export function formatShopPrice(
  amount: number,
  currency: CurrencyCode | string | null | undefined
): string {
  const code = (currency ?? "USD").toUpperCase();
  const value = Number.isFinite(amount) ? amount : 0;
  const locale = CURRENCY_FORMAT_LOCALES[code] ?? "en-US";
  const fractionDigits = getShopFractionDigits(value);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(fractionDigits)}`;
  }
}
