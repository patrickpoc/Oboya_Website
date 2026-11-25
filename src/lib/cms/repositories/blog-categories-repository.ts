import type { LocalizedString } from "@/lib/cms/types";

export const BLOG_CATEGORY_SCOPES = ["blog", "news"] as const;
export type BlogCategoryScope = (typeof BLOG_CATEGORY_SCOPES)[number];

export interface BlogCategory {
  id: string;
  slug: string;
  name: LocalizedString;
  /** Page whose filter lists this category. */
  scope: BlogCategoryScope;
}

const cat = (
  id: string,
  scope: BlogCategoryScope,
  en: string,
  ptBR: string,
  es: string,
  zh: string
): BlogCategory => ({
  id,
  slug: id,
  scope,
  name: { en, "pt-BR": ptBR, es, "zh-CN": zh },
});

const defaultCategories = (): BlogCategory[] => [
  cat("industry-trends", "blog", "Industry Trends", "Tendências do setor", "Tendencias del sector", "行业趋势"),
  cat("packaging-innovation", "blog", "Packaging Innovation", "Inovação em embalagens", "Innovación en envases", "包装创新"),
  cat("supply-chain-logistics", "blog", "Supply Chain & Logistics", "Cadeia de suprimentos e logística", "Cadena de suministro y logística", "供应链与物流"),
  cat("retail-merchandising", "blog", "Retail & Merchandising", "Varejo e merchandising", "Retail y merchandising", "零售与陈列"),
  cat("innovation-technology", "blog", "Innovation & Technology", "Inovação e tecnologia", "Innovación y tecnología", "创新与技术"),
  cat("trade-fairs-events", "blog", "Trade Fairs & Events", "Feiras e eventos", "Ferias y eventos", "展会与活动"),
  cat("company-news", "news", "Company News", "Notícias da empresa", "Noticias de la empresa", "公司新闻"),
  cat("product-launches", "news", "Product Launches", "Lançamentos de produtos", "Lanzamientos de productos", "新品发布"),
  cat("partnerships", "news", "Partnerships", "Parcerias", "Alianzas", "合作伙伴关系"),
  cat("trade-fairs", "news", "Trade Fairs", "Feiras comerciais", "Ferias comerciales", "展会"),
  cat("media-coverage", "news", "Media Coverage", "Cobertura da mídia", "Cobertura mediática", "媒体报道"),
  cat("corporate-announcements", "news", "Corporate Announcements", "Comunicados corporativos", "Comunicados corporativos", "企业公告"),
  cat("innovation-updates", "news", "Innovation Updates", "Novidades em inovação", "Novedades en innovación", "创新动态"),
];

/** Ids of the previous seed categories (replaced by the defaults above). */
export const LEGACY_BLOG_CATEGORY_IDS = [
  "general",
  "innovation",
  "sustainability",
  "market",
  "events",
] as const;

export function categoriesForScope(
  categories: BlogCategory[],
  scope: BlogCategoryScope
): BlogCategory[] {
  return categories.filter((c) => c.scope === scope);
}

/** Normalizes scope and upgrades stored lists to the current defaults. */
export function upgradeBlogCategories(stored: BlogCategory[]): BlogCategory[] {
  const validScope = (s: unknown) =>
    (BLOG_CATEGORY_SCOPES as readonly string[]).includes(s as string);
  // Already saved with scopes: respect the stored list as-is (deleted defaults stay deleted).
  if (stored.some((c) => validScope(c.scope))) {
    return stored.map((c) => ({
      ...c,
      scope: validScope(c.scope) ? c.scope : ("blog" as BlogCategoryScope),
    }));
  }
  const legacy = new Set<string>(LEGACY_BLOG_CATEGORY_IDS);
  if (stored.every((c) => legacy.has(c.id))) return defaultCategories();
  const list = stored.map((c) => ({ ...c, scope: "blog" as BlogCategoryScope }));
  const have = new Set(list.map((c) => c.id));
  return [...list, ...defaultCategories().filter((c) => !have.has(c.id))];
}

let cache: BlogCategory[] | null = null;

export function getBlogCategories(): BlogCategory[] {
  if (!cache) cache = defaultCategories();
  return cache;
}

export function replaceBlogCategoriesCache(categories: BlogCategory[]) {
  cache = upgradeBlogCategories(categories).map((c) => ({ ...c }));
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
