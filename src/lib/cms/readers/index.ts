/**
 * Unified CMS readers — public site should consume these instead of direct JSON imports.
 * Currently delegates to existing data sources with CMS layer on top where available.
 */

import { getShopCatalog, getProductById as getShopProductById } from "@/lib/shop/catalog";
import { readMapLocations } from "@/lib/map-locations.server";
import { getCmsProducts, getCmsProductById } from "@/lib/cms/repositories/product-repository";
import { getBlogPosts, getBlogPostBySlug } from "@/lib/cms/repositories/blog-repository";
import { getBlogCategories } from "@/lib/cms/repositories/blog-categories-repository";
import { getNewsPageSettings } from "@/lib/cms/repositories/news-page-repository";
import { getHomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { getAboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import { getCaseStudies, getCaseStudyById } from "@/lib/cms/repositories/case-studies-repository";
import { siteConfig } from "@/constants/site";

export async function readMapDataForSite() {
  return readMapLocations();
}

export function readShopCatalog() {
  return getShopCatalog();
}

export function readProducts() {
  const cmsProducts = getCmsProducts();
  if (cmsProducts.length > 0) {
    return cmsProducts.filter((p) => p.status === "published");
  }
  return getShopCatalog().products;
}

export function readProductById(id: string) {
  const cms = getCmsProductById(id);
  if (cms && cms.status === "published") return cms;
  return getShopProductById(id);
}

export function readBlogPosts() {
  return getBlogPosts().filter((p) => p.status === "published");
}

export function readBlogPostBySlug(slug: string) {
  const post = getBlogPostBySlug(slug);
  return post?.status === "published" ? post : undefined;
}

export function readBlogCategories() {
  return getBlogCategories();
}

export function readNewsPageSettings() {
  return getNewsPageSettings();
}

export function readHomepageSettings() {
  return getHomepageSettings();
}

export function readAboutPageSettings() {
  return getAboutPageSettings();
}

export function readCaseStudies() {
  return getCaseStudies().filter((c) => c.status === "published");
}

export function readCaseStudyBySlug(slug: string) {
  return getCaseStudies().find((c) => c.slug === slug && c.status === "published");
}

export function readSiteSettings() {
  return siteConfig;
}
