import type { LocalizedString } from "@/lib/cms/types";

export interface NewsPageSettings {
  eyebrow: LocalizedString;
  headline: LocalizedString;
  postsPerPage: number;
  updatedAt: string;
}

const defaultSettings = (): NewsPageSettings => ({
  eyebrow: {
    en: "Latest News",
    "pt-BR": "Últimas notícias",
    es: "Últimas noticias",
    "zh-CN": "最新资讯",
  },
  headline: {
    en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi lorem quam, luctus quis nunc id, commodo iaculis velit.",
    "pt-BR":
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi lorem quam, luctus quis nunc id, commodo iaculis velit.",
    es: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi lorem quam, luctus quis nunc id, commodo iaculis velit.",
    "zh-CN":
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi lorem quam, luctus quis nunc id, commodo iaculis velit.",
  },
  postsPerPage: 6,
  updatedAt: new Date().toISOString(),
});

let cache: NewsPageSettings | null = null;

export function getNewsPageSettings(): NewsPageSettings {
  if (!cache) cache = defaultSettings();
  return cache;
}

export function saveNewsPageSettings(settings: NewsPageSettings): NewsPageSettings {
  const updated = { ...settings, updatedAt: new Date().toISOString() };
  cache = updated;
  return updated;
}
