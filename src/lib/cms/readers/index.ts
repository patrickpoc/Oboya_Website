/**
 * Unified CMS readers — public site should consume these instead of direct JSON imports.
 * Hydrates durable CMS files into memory before returning content.
 */

import { getShopCatalog, getProductById as getShopProductById } from "@/lib/shop/catalog";
import { readMapLocations } from "@/lib/map-locations.server";
import { getCmsProducts, getCmsProductById } from "@/lib/cms/repositories/product-repository";
import { getBlogPostBySlug } from "@/lib/cms/repositories/blog-repository";
import { getBlogCategories } from "@/lib/cms/repositories/blog-categories-repository";
import { siteConfig } from "@/constants/site";
import { readHomepageSettingsDurable } from "@/lib/cms/server/homepage.server";
import {
  readAboutDurable,
  readBlogDurable,
  readCasesDurable,
  readFaqsDurable,
  readNewsDurable,
} from "@/lib/cms/server/content.server";

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

export async function readBlogPosts() {
  const posts = await readBlogDurable();
  return posts.filter((p) => p.status === "published");
}

export async function readBlogPostBySlug(slug: string) {
  await readBlogDurable();
  const post = getBlogPostBySlug(slug);
  return post?.status === "published" ? post : undefined;
}

export function readBlogCategories() {
  return getBlogCategories();
}

export async function readNewsPageSettings() {
  return readNewsDurable();
}

export async function readHomepageSettings() {
  return readHomepageSettingsDurable();
}

export async function readAboutPageSettings() {
  return readAboutDurable();
}

export async function readCaseStudies() {
  const studies = await readCasesDurable();
  return studies.filter((c) => c.status === "published");
}

export async function readCaseStudyBySlug(slug: string) {
  const studies = await readCasesDurable();
  return studies.find((c) => c.slug === slug && c.status === "published");
}

export function readSiteSettings() {
  return siteConfig;
}

export async function readFaqCategories() {
  const data = await readFaqsDurable();
  return data.categories;
}

export async function readFaqs() {
  const data = await readFaqsDurable();
  return data.faqs.filter((f) => f.status === "published");
}
