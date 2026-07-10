import type { LocalizedString } from "@/lib/cms/types";

export interface BlogCategory {
  id: string;
  slug: string;
  name: LocalizedString;
}

const defaultCategories = (): BlogCategory[] => [
  {
    id: "general",
    slug: "general",
    name: {
      en: "General",
      "pt-BR": "Geral",
      es: "General",
      "zh-CN": "综合",
    },
  },
  {
    id: "innovation",
    slug: "innovation",
    name: {
      en: "Innovation",
      "pt-BR": "Inovação",
      es: "Innovación",
      "zh-CN": "创新",
    },
  },
  {
    id: "sustainability",
    slug: "sustainability",
    name: {
      en: "Sustainability",
      "pt-BR": "Sustentabilidade",
      es: "Sostenibilidad",
      "zh-CN": "可持续发展",
    },
  },
  {
    id: "market",
    slug: "market",
    name: {
      en: "Market Trends",
      "pt-BR": "Tendências de mercado",
      es: "Tendencias de mercado",
      "zh-CN": "市场趋势",
    },
  },
  {
    id: "events",
    slug: "events",
    name: {
      en: "Events",
      "pt-BR": "Eventos",
      es: "Eventos",
      "zh-CN": "活动",
    },
  },
];

let cache: BlogCategory[] | null = null;

export function getBlogCategories(): BlogCategory[] {
  if (!cache) cache = defaultCategories();
  return cache;
}

export function getBlogCategoryById(id: string): BlogCategory | undefined {
  return getBlogCategories().find((c) => c.id === id);
}

export function saveBlogCategory(category: BlogCategory): BlogCategory {
  const categories = getBlogCategories();
  const idx = categories.findIndex((c) => c.id === category.id);
  if (idx >= 0) categories[idx] = category;
  else categories.push(category);
  cache = categories;
  return category;
}

export function deleteBlogCategory(id: string): boolean {
  const categories = getBlogCategories();
  const idx = categories.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  categories.splice(idx, 1);
  cache = categories;
  return true;
}
