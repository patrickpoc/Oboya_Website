import type { CmsStatus, LocalizedString, SeoFields } from "@/lib/cms/types";
import { blogPosts } from "@/constants/content-data";
import { BLOG_SEED_I18N, type BlogSeedCopy } from "@/lib/cms/blog-i18n";
import { mergeLocalized } from "@/lib/cms/utils";

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
  scheduledAt?: string;
  seo: SeoFields;
  createdAt: string;
  updatedAt: string;
}

const emptyLoc = (): LocalizedString => ({ en: "", "pt-BR": "", es: "", "zh-CN": "" });

function migrateBlogPost(post: CmsBlogPost, seedCopy?: BlogSeedCopy): CmsBlogPost {
  if (!seedCopy) return post;
  return {
    ...post,
    title: mergeLocalized(post.title, seedCopy.title),
    excerpt: mergeLocalized(post.excerpt, seedCopy.excerpt),
  };
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
      status: "published" as CmsStatus,
      publishedAt: p.date,
      seo: { title: emptyLoc(), description: emptyLoc() },
      createdAt: p.date,
      updatedAt: p.date,
    };
  });
}

let cache: CmsBlogPost[] | null = null;

const seedKeyBySlug = Object.fromEntries(
  blogPosts.map((p) => [p.slug, p.messageKey])
);

export function getBlogPosts(): CmsBlogPost[] {
  if (!cache) cache = seed();
  return cache.map((post) => {
    const seedCopy = BLOG_SEED_I18N[seedKeyBySlug[post.slug] ?? ""];
    return migrateBlogPost(post, seedCopy);
  });
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
  const posts = getBlogPosts();
  const idx = posts.findIndex((p) => p.id === post.id);
  const updated = { ...post, updatedAt: new Date().toISOString() };
  if (idx >= 0) posts[idx] = updated;
  else posts.push(updated);
  cache = posts;
  return updated;
}

export function deleteBlogPost(id: string): boolean {
  const posts = getBlogPosts();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  posts.splice(idx, 1);
  cache = posts;
  return true;
}

export { getBlogAuthors, type BlogAuthor } from "./blog-authors-repository";
export { getBlogCategories } from "./blog-categories-repository";
