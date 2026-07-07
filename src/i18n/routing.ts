import { defineRouting } from "next-intl/routing";

export const locales = ["en", "pt-BR", "es", "zh-CN"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Portugues (BR)",
  es: "Espanol",
  "zh-CN": "中文",
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});
