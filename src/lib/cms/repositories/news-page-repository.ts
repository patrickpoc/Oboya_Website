import type { CmsLocale, LocalizedString } from "@/lib/cms/types";

export interface NewsPageSettings {
  title: LocalizedString;
  subtitle: LocalizedString;
  intro: LocalizedString;
  postsPerPage: number;
  updatedAt: string;
}

const LOCALES: CmsLocale[] = ["en", "pt-BR", "es", "zh-CN"];

export const NEWS_PAGE_DEFAULT_TEXT = {
  title: {
    "en": "The Latest From Oboya Horticulture",
    "pt-BR": "As Novidades da Oboya Horticulture",
    "es": "Lo Último de Oboya Horticulture",
    "zh-CN": "Oboya Horticulture 最新动态",
  },
  subtitle: {
    "en": "Company announcements, partnerships, innovations, product launches, and industry news.",
    "pt-BR": "Comunicados da empresa, parcerias, inovações, lançamentos de produtos e notícias do setor.",
    "es": "Anuncios de la empresa, alianzas, innovaciones, lanzamientos de productos y noticias del sector.",
    "zh-CN": "公司公告、合作伙伴关系、创新成果、产品发布及行业新闻。",
  },
  intro: {
    "en": "Stay up to date on developments across Oboya's global operations, strategic partnerships, events, and innovation initiatives.",
    "pt-BR": "Acompanhe os desenvolvimentos das operações globais, parcerias estratégicas, eventos e iniciativas de inovação da Oboya.",
    "es": "Manténgase al día con los avances de las operaciones globales de Oboya, sus alianzas estratégicas, eventos e iniciativas de innovación.",
    "zh-CN": "随时了解 Oboya 全球业务、战略合作、活动及创新举措的最新进展。",
  },
} satisfies Record<"title" | "subtitle" | "intro", LocalizedString>;

const defaultSettings = (): NewsPageSettings => ({
  title: { ...NEWS_PAGE_DEFAULT_TEXT.title },
  subtitle: { ...NEWS_PAGE_DEFAULT_TEXT.subtitle },
  intro: { ...NEWS_PAGE_DEFAULT_TEXT.intro },
  postsPerPage: 6,
  updatedAt: new Date().toISOString(),
});

function normalizeLocalized(value: unknown, defaults: LocalizedString): LocalizedString {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const out = {} as LocalizedString;
  for (const locale of LOCALES) {
    const raw = source[locale];
    out[locale] = typeof raw === "string" && raw.trim() ? raw : defaults[locale];
  }
  return out;
}

/** Fills missing/blank values with defaults; legacy eyebrow/headline are dropped. */
export function normalizeNewsPageSettings(input: unknown): NewsPageSettings {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const perPage = Number(raw.postsPerPage);
  return {
    title: normalizeLocalized(raw.title, NEWS_PAGE_DEFAULT_TEXT.title),
    subtitle: normalizeLocalized(raw.subtitle, NEWS_PAGE_DEFAULT_TEXT.subtitle),
    intro: normalizeLocalized(raw.intro, NEWS_PAGE_DEFAULT_TEXT.intro),
    postsPerPage: Number.isFinite(perPage) && perPage > 0 ? perPage : 6,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
  };
}

let cache: NewsPageSettings | null = null;

export function getNewsPageSettings(): NewsPageSettings {
  if (!cache) cache = defaultSettings();
  return cache;
}

export function replaceNewsPageSettingsCache(settings: NewsPageSettings) {
  cache = normalizeNewsPageSettings(settings);
}

export function saveNewsPageSettings(settings: NewsPageSettings): NewsPageSettings {
  const updated = { ...normalizeNewsPageSettings(settings), updatedAt: new Date().toISOString() };
  cache = updated;
  return updated;
}
