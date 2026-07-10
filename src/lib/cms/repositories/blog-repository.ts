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

const seedTitles: Record<string, { title: string; excerpt: string }> = {
  post1: {
    title: "2025 Exhibition Overview: OBOYA Invites You to Join Us at Major Industry Events",
    excerpt: "Discover where to meet the Oboya team at leading horticulture exhibitions worldwide.",
  },
  post2: {
    title: "Sustainable packaging trends in fresh produce",
    excerpt: "How retailers and growers are aligning packaging with circular economy goals.",
  },
  post3: {
    title: "Greenhouse innovation in 2026",
    excerpt: "Climate control, substrates, and logistics are converging in modern greenhouse design.",
  },
  post4: {
    title: "Berry category growth in retail",
    excerpt: "Packaging and display solutions supporting premium berry programs.",
  },
  post5: {
    title: "Expanding our footprint in Asia-Pacific markets",
    excerpt: "New distribution partnerships strengthen local support across the region.",
  },
  post6: {
    title: "Next-generation greenhouse technology for sustainable production",
    excerpt: "Integrated systems helping growers optimize yield and resource efficiency.",
  },
  post7: {
    title: "Circular packaging program launches in Europe",
    excerpt: "Recyclable formats piloted with retail partners across key markets.",
  },
  post8: {
    title: "Retail display innovation for premium produce",
    excerpt: "New trolley and packaging concepts improve shelf visibility and handling.",
  },
  post9: {
    title: "Global partner summit highlights integrated solutions",
    excerpt: "Growers and distributors explore end-to-end horticulture systems.",
  },
};

function seed(): CmsBlogPost[] {
  return blogPosts.map((p) => {
    const copy = seedTitles[p.messageKey];
    const title = copy?.title ?? p.slug.replace(/-/g, " ");
    const excerpt = copy?.excerpt ?? "";
    return {
      id: p.slug,
      slug: p.slug,
      title: { en: title, "pt-BR": title, es: title, "zh-CN": title },
      excerpt: { en: excerpt, "pt-BR": excerpt, es: excerpt, "zh-CN": excerpt },
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

export const blogAuthors = [
  { id: "editorial", name: "Oboya Editorial", email: "editorial@oboya.cc" },
  { id: "marketing", name: "Marketing Team", email: "marketing@oboya.cc" },
];

export { getBlogCategories } from "./blog-categories-repository";
