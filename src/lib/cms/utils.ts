import type { CmsLocale, LocalizedString } from "@/lib/cms/types";

export function pickLocalized(
  value: LocalizedString,
  locale: string,
  fallback: CmsLocale = "en"
): string {
  const key = locale as CmsLocale;
  return value[key] || value[fallback] || value.en || "";
}

/**
 * Fill empty locale fields from defaults.
 * If a non-English locale is only a copy of the English source, and that
 * English still matches the known default, use the default translation.
 * A locale that differs from English is left as the editor saved it.
 */
export function mergeLocalized(
  current: LocalizedString | undefined,
  fallback: LocalizedString
): LocalizedString {
  if (!current) return fallback;
    const normalize = (value: string) =>
    value.replace(/[!?.。！？]+$/g, "").trim();
  const english = current.en?.trim() ?? "";
  const fallbackEnglish = fallback.en?.trim() ?? "";
  const pick = (locale: CmsLocale) => {
    const value = current[locale]?.trim() ?? "";
    const translated = fallback[locale]?.trim() ?? "";
    if (!value) return translated;
    const copiedFromEnglish =
      locale !== "en" &&
      normalize(value) === normalize(english) &&
      normalize(english) === normalize(fallbackEnglish) &&
      translated !== "" &&
      translated !== fallbackEnglish;
    if (copiedFromEnglish) return translated;
    return current[locale] ?? translated;
  };
  return {
    en: pick("en"),
    "pt-BR": pick("pt-BR"),
    es: pick("es"),
    "zh-CN": pick("zh-CN"),
  };
}
