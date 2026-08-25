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

export function formatShopPrice(
  amount: number,
  currency: CurrencyCode | string | null | undefined
): string {
  const code = (currency ?? "USD").toUpperCase();
  const value = Number.isFinite(amount) ? amount : 0;
  const locale = CURRENCY_FORMAT_LOCALES[code] ?? "en-US";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
}
