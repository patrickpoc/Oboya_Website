import type { CmsLocale, LocalizedString } from "@/lib/cms/types";

export function pickLocalized(
  value: LocalizedString,
  locale: string,
  fallback: CmsLocale = "en"
): string {
  const key = locale as CmsLocale;
  return value[key] || value[fallback] || value.en || "";
}

/** Fill missing or English-copied locale fields from defaults (live Supabase safety). */
export function mergeLocalized(
  current: LocalizedString | undefined,
  fallback: LocalizedString
): LocalizedString {
  if (!current) return fallback;
  const en = current.en || fallback.en;
  const pick = (value: string | undefined, fb: string) =>
    value && value !== en ? value : fb;
  return {
    en,
    "pt-BR": pick(current["pt-BR"], fallback["pt-BR"]),
    es: pick(current.es, fallback.es),
    "zh-CN": pick(current["zh-CN"], fallback["zh-CN"]),
  };
}
