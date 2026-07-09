import type { CmsStatus, LocalizedString, SeoFields } from "@/lib/cms/types";
import { blogPosts } from "@/constants/content-data";

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

function seed(): CmsBlogPost[] {
  return blogPosts.map((p) => ({
    id: p.slug,
    slug: p.slug,
    title: {
      en: p.slug.replace(/-/g, " "),
      "pt-BR": p.slug.replace(/-/g, " "),
      es: p.slug.replace(/-/g, " "),
      "zh-CN": p.slug.replace(/-/g, " "),
    },
    excerpt: emptyLoc(),
    body: emptyLoc(),
    author: p.author,
    categoryId: "general",
    relatedPostIds: [],
    status: "published" as CmsStatus,
    publishedAt: p.date,
    seo: { title: emptyLoc(), description: emptyLoc() },
    createdAt: p.date,
    updatedAt: p.date,
  }));
}

let cache: CmsBlogPost[] | null = null;

export function getBlogPosts(): CmsBlogPost[] {
  if (!cache) cache = seed();
  return cache;
}

export function getBlogPostById(id: string): CmsBlogPost | undefined {
  return getBlogPosts().find((p) => p.id === id);
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

export const blogCategories = [
  { id: "general", name: "General" },
  { id: "innovation", name: "Innovation" },
  { id: "sustainability", name: "Sustainability" },
  { id: "market", name: "Market Trends" },
];

export const blogAuthors = [
  { id: "editorial", name: "Oboya Editorial", email: "editorial@oboya.cc" },
  { id: "marketing", name: "Marketing Team", email: "marketing@oboya.cc" },
];
