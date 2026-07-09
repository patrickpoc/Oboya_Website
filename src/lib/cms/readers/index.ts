/**
 * Unified CMS readers — public site should consume these instead of direct JSON imports.
 * Currently delegates to existing data sources with CMS layer on top where available.
 */

import { getShopCatalog, getProductById as getShopProductById } from "@/lib/shop/catalog";
import { readMapLocations } from "@/lib/map-locations.server";
import { getCmsProducts, getCmsProductById } from "@/lib/cms/repositories/product-repository";
import { getBlogPosts, getBlogPostById } from "@/lib/cms/repositories/blog-repository";
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
  return getBlogPosts().find((p) => p.slug === slug && p.status === "published");
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
