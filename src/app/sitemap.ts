import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAllPageSlugs } from "@/constants/pages";

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

  return [...homeEntries, ...catalogueEntries, ...pageEntries];
}
