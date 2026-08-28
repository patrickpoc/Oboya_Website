import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAllPageSlugs } from "@/constants/pages";
import { readBlogPosts, readProducts } from "@/lib/cms/readers";

const baseUrl = "https://oboya.cc";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const posts = await readBlogPosts();
  const newsEntries = routing.locales.flatMap((locale) => {
    const index = {
      url: `${baseUrl}/${locale}/news`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    };
    const articles = posts.map((post) => ({
      url: `${baseUrl}/${locale}/news/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    }));
    return [index, ...articles];
  });

  const products = await readProducts();
  const productEntries = routing.locales.flatMap((locale) =>
    products.map((product) => ({
      url: `${baseUrl}/${locale}/shop/products/${product.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  );

  const shopIndexEntries = routing.locales.map((locale) => ({
    url: `${baseUrl}/${locale}/shop`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...homeEntries, ...shopIndexEntries, ...productEntries, ...newsEntries, ...pageEntries];
}
