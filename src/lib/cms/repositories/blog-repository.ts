import type { CmsStatus, LocalizedString, SeoFields } from "@/lib/cms/types";
import { blogPosts } from "@/constants/content-data";
import { BLOG_SEED_I18N } from "@/lib/cms/blog-i18n";

export const BLOG_CROP_IDS = ["flowers", "vegetables", "fruits"] as const;
export type BlogCropId = (typeof BLOG_CROP_IDS)[number];

export interface CmsBlogPost {
  id: string;
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  body: LocalizedString;
  author: string;
  categoryId: string;
  featuredImage?: string;
  relatedPostIds: string[];
  /** Crops this post belongs to. Empty = general post (only under "All Crops"). */
  crops: BlogCropId[];
  /** Post shown in the featured slot of the blog. */
  featured: boolean;
  status: CmsStatus;
  publishedAt?: string;
  /** Manual listing order — lower appears first. Falls back to publishedAt. */
  sortOrder?: number;
  scheduledAt?: string;
  seo: SeoFields;
  createdAt: string;
  updatedAt: string;
}

const emptyLoc = (): LocalizedString => ({ en: "", "pt-BR": "", es: "", "zh-CN": "" });

const SEED_CROPS: Record<string, BlogCropId[]> = {
  "greenhouse-innovation-2026": ["vegetables"],
  "berry-retail-growth": ["fruits"],
  "greenhouse-technology": ["vegetables"],
  "retail-display-innovation": ["flowers"],
};
const SEED_FEATURED_SLUG = "2025-exhibition-overview";

/** Fills defaults / drops invalid values for posts read from storage. */
export function normalizeBlogPost(post: CmsBlogPost): CmsBlogPost {
  const raw: unknown = (post as { crops?: unknown }).crops;
  const crops = Array.isArray(raw)
    ? BLOG_CROP_IDS.filter((id) => raw.includes(id))
    : [];
  return {
    ...post,
    crops,
    featured: (post as { featured?: unknown }).featured === true,
  };
}

/** First published featured post, else the first post (input already sorted). */
export function pickFeaturedPost<T extends CmsBlogPost>(posts: T[]): T | undefined {
  return (
    posts.find((p) => p.featured === true && p.status === "published") ?? posts[0]
  );
}

function seed(): CmsBlogPost[] {
  return blogPosts.map((p) => {
    const copy = BLOG_SEED_I18N[p.messageKey];
    const titleEn = copy?.title.en ?? p.slug.replace(/-/g, " ");
    const excerptEn = copy?.excerpt.en ?? "";
    const title = copy?.title ?? {
      en: titleEn,
      "pt-BR": titleEn,
      es: titleEn,
      "zh-CN": titleEn,
    };
    const excerpt = copy?.excerpt ?? {
      en: excerptEn,
      "pt-BR": excerptEn,
      es: excerptEn,
      "zh-CN": excerptEn,
    };
    return {
      id: p.slug,
      slug: p.slug,
      title,
      excerpt,
      body: emptyLoc(),
      author: p.author,
      categoryId: p.categoryId,
      featuredImage: p.featuredImage,
      relatedPostIds: [],
      crops: SEED_CROPS[p.slug] ?? [],
      featured: p.slug === SEED_FEATURED_SLUG,
      status: "published" as CmsStatus,
      publishedAt: p.date,
      seo: { title: emptyLoc(), description: emptyLoc() },
      createdAt: p.date,
      updatedAt: p.date,
    };
  });
}

let cache: CmsBlogPost[] | null = null;

export function getBlogPosts(): CmsBlogPost[] {
  if (!cache) cache = seed();
  return cache;
}

export function replaceBlogPostsCache(posts: CmsBlogPost[]) {
  cache = posts.map((p) => normalizeBlogPost(p));
}

export function getBlogPostById(id: string): CmsBlogPost | undefined {
  return getBlogPosts().find((p) => p.id === id);
}

export function getBlogPostBySlug(slug: string): CmsBlogPost | undefined {
  return getBlogPosts().find((p) => p.slug === slug);
}

export function saveBlogPost(post: CmsBlogPost): CmsBlogPost {
  if (!cache) cache = seed();
  const updated = { ...normalizeBlogPost(post), updatedAt: new Date().toISOString() };
  const idx = cache.findIndex((p) => p.id === post.id);
  if (idx >= 0) cache[idx] = updated;
  else cache.push(updated);
  return updated;
}

export function deleteBlogPost(id: string): boolean {
  if (!cache) cache = seed();
  const idx = cache.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  cache.splice(idx, 1);
  return true;
}

/** Manual sortOrder first (ascending), then publishedAt desc. */
export function sortBlogPostsForDisplay(posts: CmsBlogPost[]): CmsBlogPost[] {
  return [...posts].sort((a, b) => {
    const ao = a.sortOrder;
    const bo = b.sortOrder;
    const aHas = typeof ao === "number" && Number.isFinite(ao);
    const bHas = typeof bo === "number" && Number.isFinite(bo);
    if (aHas && bHas && ao !== bo) return ao - bo;
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return (
      new Date(b.publishedAt ?? 0).getTime() -
      new Date(a.publishedAt ?? 0).getTime()
    );
  });
}

export function reorderBlogPosts(orderedIds: string[]): CmsBlogPost[] {
  const posts = getBlogPosts();
  const byId = new Map(posts.map((post) => [post.id, post]));
  const next: CmsBlogPost[] = [];
  orderedIds.forEach((id, index) => {
    const post = byId.get(id);
    if (!post) return;
    next.push({ ...post, sortOrder: index, updatedAt: new Date().toISOString() });
    byId.delete(id);
  });
  for (const leftover of byId.values()) {
    next.push({
      ...leftover,
      sortOrder: next.length,
      updatedAt: new Date().toISOString(),
    });
  }
  cache = next;
  return next;
}

export { getBlogAuthors, type BlogAuthor } from "./blog-authors-repository";
export { getBlogCategories } from "./blog-categories-repository";
