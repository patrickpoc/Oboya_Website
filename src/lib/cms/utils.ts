import type { CmsLocale, LocalizedString } from "@/lib/cms/types";

export function pickLocalized(
  value: LocalizedString,
  locale: string,
  fallback: CmsLocale = "en"
): string {
  const key = locale as CmsLocale;
  return value[key] || value[fallback] || value.en || "";
}
