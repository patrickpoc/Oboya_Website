import type { PublicJobOpening } from "@/lib/cms/careers/public";

export function countryName(code: string | undefined, locale: string): string {
  if (!code) return "";
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export function languageName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** "City, Country" with either part optional. */
export function locationLabel(o: Pick<PublicJobOpening, "city" | "countryCode">, locale: string): string {
  return [o.city, countryName(o.countryCode, locale)].filter(Boolean).join(", ");
}

export function formatMoney(value: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

export function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Stable (UTC) date so server and client render the same text. */
export function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso));
}
