/**
 * Unified CMS readers — public site should consume these instead of direct JSON imports.
 * Currently delegates to existing data sources with CMS layer on top where available.
 */

import { getShopCatalog, getProductById as getShopProductById } from "@/lib/shop/catalog";
import { readMapLocations } from "@/lib/map-locations.server";
import { getCmsProducts, getCmsProductById } from "@/lib/cms/repositories/product-repository";
import { readBlogPostsDurable } from "@/lib/cms/server/blog-posts.server";
import { readBlogCategoriesDurable } from "@/lib/cms/server/blog-categories.server";
import { readNewsPageSettingsDurable } from "@/lib/cms/server/news-page.server";
import { readHomepageSettingsDurable } from "@/lib/cms/server/homepage.server";
import { readAboutPageSettingsDurable } from "@/lib/cms/server/about-page.server";
import { readCaseStudiesDurable } from "@/lib/cms/server/case-studies.server";
import { readFaqsDurable } from "@/lib/cms/server/faqs.server";
import { hydrateShopCatalogDurable } from "@/lib/cms/server/marketplace-config.server";
import { siteConfig } from "@/constants/site";

export async function readMapDataForSite() {
  return readMapLocations();
}

export async function readShopCatalog() {
  await hydrateShopCatalogDurable();
  return getShopCatalog();
}

export async function readProducts() {
  await hydrateShopCatalogDurable();
  const cmsProducts = getCmsProducts();
  if (cmsProducts.length > 0) {
    return cmsProducts.filter((p) => p.status === "published");
  }
  return getShopCatalog().products;
}

export async function readPublishedProductById(id: string) {
  const { readProducts: readProductsFromStore } = await import(
    "@/lib/cms/server/products.server"
  );
  const product = (await readProductsFromStore()).find((item) => item.id === id);
  if (!product || product.status !== "published" || product.deletedAt) {
    return undefined;
  }
  return product;
}

export function readProductById(id: string) {
  const cms = getCmsProductById(id);
  if (cms && cms.status === "published") return cms;
  return getShopProductById(id);
}

export async function readBlogPosts() {
  return (await readBlogPostsDurable()).filter((p) => p.status === "published");
}

export async function readBlogPostBySlug(slug: string) {
  const post = (await readBlogPostsDurable()).find((p) => p.slug === slug);
  return post?.status === "published" ? post : undefined;
}

export async function readBlogCategories() {
  return readBlogCategoriesDurable();
}

export async function readNewsPageSettings() {
  return readNewsPageSettingsDurable();
}

export async function readHomepageSettings() {
  return readHomepageSettingsDurable();
}

export async function readAboutPageSettings() {
  return readAboutPageSettingsDurable();
}

export async function readCaseStudies() {
  return (await readCaseStudiesDurable()).filter((c) => c.status === "published");
}

export async function readCaseStudyBySlug(slug: string) {
  return (await readCaseStudiesDurable()).find(
    (c) => c.slug === slug && c.status === "published"
  );
}

export function readSiteSettings() {
  return siteConfig;
}

export async function readFaqCategories() {
  return (await readFaqsDurable()).categories;
}

export async function readFaqs() {
  return (await readFaqsDurable()).faqs.filter((f) => f.status === "published");
}
