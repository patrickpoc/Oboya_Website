import type { LocalizedString } from "@/lib/cms/types";

export function loc(en: string, pt?: string, es?: string, zh?: string): LocalizedString {
  return {
    en,
    "pt-BR": pt ?? en,
    es: es ?? en,
    "zh-CN": zh ?? en,
  };
}
