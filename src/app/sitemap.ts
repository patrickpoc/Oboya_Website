import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAllPageSlugs } from "@/constants/pages";
import { readBlogPosts } from "@/lib/cms/readers";

const baseUrl = "https://oboya.cc";

export default function sitemap(): MetadataRoute.Sitemap {
  const homeEntries = routing.locales.map((locale) => ({
    url: `${baseUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 1,
  }));

  const pageEntries = routing.locales.flatMap((locale) =>
    getAllPageSlugs().map((slug) => ({
      url: `${baseUrl}/${locale}/${slug.join("/")}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  );

  const catalogueEntries = routing.locales.map((locale) => ({
    url: `${baseUrl}/${locale}/catalogue`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const newsEntries = routing.locales.flatMap((locale) => {
    const index = {
      url: `${baseUrl}/${locale}/news`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    };
    const articles = readBlogPosts().map((post) => ({
      url: `${baseUrl}/${locale}/news/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    }));
    return [index, ...articles];
  });

  return [...homeEntries, ...catalogueEntries, ...newsEntries, ...pageEntries];
}
