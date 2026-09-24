import type { CmsStatus, LocalizedString, SeoFields } from "@/lib/cms/types";
import { blogPosts } from "@/constants/content-data";
import { BLOG_SEED_I18N } from "@/lib/cms/blog-i18n";

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
  cache = posts.map((p) => ({ ...p }));
}

export function getBlogPostById(id: string): CmsBlogPost | undefined {
  return getBlogPosts().find((p) => p.id === id);
}

export function getBlogPostBySlug(slug: string): CmsBlogPost | undefined {
  return getBlogPosts().find((p) => p.slug === slug);
}

export function saveBlogPost(post: CmsBlogPost): CmsBlogPost {
  if (!cache) cache = seed();
  const updated = { ...post, updatedAt: new Date().toISOString() };
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
