import type { CmsLocale, LocalizedString } from "@/lib/cms/types";

export function pickLocalized(
  value: LocalizedString,
  locale: string,
  fallback: CmsLocale = "en"
): string {
  const key = locale as CmsLocale;
  return value[key] || value[fallback] || value.en || "";
}

/** Fill only empty locale fields from defaults. Never overwrite CMS edits. */
export function mergeLocalized(
  current: LocalizedString | undefined,
  fallback: LocalizedString
): LocalizedString {
  if (!current) return fallback;
  const pick = (value: string | undefined, fb: string) =>
    value?.trim() ? value : fb;
  return {
    en: pick(current.en, fallback.en),
    "pt-BR": pick(current["pt-BR"], fallback["pt-BR"]),
    es: pick(current.es, fallback.es),
    "zh-CN": pick(current["zh-CN"], fallback["zh-CN"]),
  };
}
