import { normalizeProductTag } from "@/lib/shop/product-tags";
import {
  normalizeColorVariants,
  normalizeImageColorIds,
  normalizeLocalizedColorName,
} from "@/lib/shop/color-variants";
import type { ShopProduct } from "@/lib/shop/types";
import type { CmsStatus, LocalizedString, SeoFields } from "@/lib/cms/types";
import { collectAllSkus } from "@/lib/cms/admin-sku-lookup";
import productsData from "@/../data/shop/products.json";

export interface CmsProduct extends ShopProduct {
  name: LocalizedString;
  shortDescription: LocalizedString;
  description: LocalizedString;
  status: CmsStatus;
  seo: SeoFields;
  deletedAt?: string | null;
  purgeAt?: string | null;
}

let productsCache: CmsProduct[] | null = null;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function emptyLocalizedString(): LocalizedString {
  return { en: "", "pt-BR": "", es: "", "zh-CN": "" };
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeLocalizedById(id: string): LocalizedString {
  const value = id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { en: value, "pt-BR": value, es: value, "zh-CN": value };
}

function withDefaults(p: ShopProduct): CmsProduct {
  const existing = p as Partial<CmsProduct>;
  return {
    ...p,
    enabledCountries: p.enabledCountries ?? { ...p.availability },
    stockQuantity: p.stockQuantity ?? null,
    unlimitedStock: p.unlimitedStock ?? true,
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [""],
    imageColorIds: normalizeImageColorIds(
      existing.imageColorIds ?? p.imageColorIds,
      (Array.isArray(p.images) && p.images.length > 0 ? p.images : [""]).length
    ),
    defaultColor:
      typeof existing.defaultColor === "string"
        ? existing.defaultColor
        : typeof p.defaultColor === "string"
          ? p.defaultColor
          : "",
    defaultColorName: normalizeLocalizedColorName(
      existing.defaultColorName ?? p.defaultColorName
    ),
    colorVariants: normalizeColorVariants(p.colorVariants ?? existing.colorVariants),
    name: existing.name ?? normalizeLocalizedById(p.id),
    shortDescription: existing.shortDescription ?? emptyLocalizedString(),
    description: existing.description ?? emptyLocalizedString(),
    status: existing.status ?? ("published" as CmsStatus),
    seo: {
      title: existing.seo?.title ?? emptyLocalizedString(),
      description: existing.seo?.description ?? emptyLocalizedString(),
    },
    deletedAt: existing.deletedAt ?? null,
    purgeAt: existing.purgeAt ?? null,
  };
}

function purgeExpired(items: CmsProduct[]): CmsProduct[] {
  const now = Date.now();
  return items.filter((item) => {
    if (!item.purgeAt) return true;
    const purgeTime = new Date(item.purgeAt).getTime();
    if (Number.isNaN(purgeTime)) return true;
    return purgeTime > now;
  });
}

/** Drop trash items whose purge window has elapsed. Returns how many were removed. */
export function purgeExpiredCmsProducts(): number {
  if (!productsCache) productsCache = seedProducts();
  const before = productsCache.length;
  productsCache = purgeExpired(productsCache);
  return before - productsCache.length;
}

export function isProductPurgeDue(product: Pick<CmsProduct, "purgeAt">): boolean {
  if (!product.purgeAt) return false;
  const purgeTime = new Date(product.purgeAt).getTime();
  if (Number.isNaN(purgeTime)) return false;
  return purgeTime <= Date.now();
}

function seedProducts(): CmsProduct[] {
  return (productsData as ShopProduct[]).map(withDefaults);
}

function buildUniqueDuplicateSku(baseSku: string, existingSkus: Set<string>) {
  const candidate = `${baseSku}-COPY`;
  if (!existingSkus.has(candidate.toLowerCase())) return candidate;

  let suffix = 2;
  while (existingSkus.has(`${baseSku}-COPY-${suffix}`.toLowerCase())) {
    suffix += 1;
  }
  return `${baseSku}-COPY-${suffix}`;
}

export function duplicateCmsProduct(id: string): CmsProduct | null {
  const original = getCmsProductById(id);
  if (!original) return null;
  const existingSkus = collectAllSkus(getCmsProducts({ includeDeleted: true }), {
    includeLegacyIds: true,
  });
  const newSku = buildUniqueDuplicateSku(original.sku, existingSkus);
  existingSkus.add(newSku.toLowerCase());
  const colorVariants = (original.colorVariants ?? []).map((variant) => {
    const base = variant.sku?.trim() || `${newSku}-COLOR`;
    const variantSku = buildUniqueDuplicateSku(base, existingSkus);
    existingSkus.add(variantSku.toLowerCase());
    return {
      ...variant,
      sku: variantSku,
      id: variantSku,
    };
  });
  const copy: CmsProduct = {
    ...JSON.parse(JSON.stringify(original)),
    id: newSku,
    sku: newSku,
    colorVariants,
    status: "draft",
    deletedAt: null,
    purgeAt: null,
  };
  return saveCmsProduct(copy);
}

export function getCmsProducts(options?: { includeDeleted?: boolean }): CmsProduct[] {
  if (!productsCache) productsCache = seedProducts();
  productsCache = purgeExpired(productsCache);
  if (options?.includeDeleted) return productsCache;
  return productsCache.filter((p) => !p.deletedAt);
}

export function getDeletedCmsProducts(): CmsProduct[] {
  return getCmsProducts({ includeDeleted: true }).filter((p) => Boolean(p.deletedAt));
}

export function getCmsProductById(id: string): CmsProduct | undefined {
  return getCmsProducts({ includeDeleted: true }).find((p) => p.id === id);
}

export function saveCmsProduct(product: CmsProduct): CmsProduct {
  const products = getCmsProducts({ includeDeleted: true });
  const idx = products.findIndex((p) => p.id === product.id);
  const normalized = {
    ...product,
    enabledCountries: product.enabledCountries ?? { ...product.availability },
    defaultColor: product.defaultColor ?? "",
    defaultColorName: normalizeLocalizedColorName(product.defaultColorName),
    images: product.images?.length ? product.images : [""],
    imageColorIds: normalizeImageColorIds(
      product.imageColorIds,
      (product.images?.length ? product.images : [""]).length
    ),
    colorVariants: normalizeColorVariants(product.colorVariants),
    deletedAt: null,
    purgeAt: null,
  };
  if (idx >= 0) products[idx] = normalized;
  else products.push(normalized);
  productsCache = products;
  return normalized;
}

export function softDeleteCmsProduct(id: string): boolean {
  const products = getCmsProducts({ includeDeleted: true });
  const idx = products.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  const deletedAt = nowIso();
  const purgeAt = new Date(Date.now() + ONE_DAY_MS).toISOString();
  products[idx] = { ...products[idx], deletedAt, purgeAt };
  productsCache = products;
  return true;
}

export function softDeleteCmsProducts(ids: string[]): number {
  let count = 0;
  ids.forEach((id) => {
    if (softDeleteCmsProduct(id)) count += 1;
  });
  return count;
}

export function restoreCmsProduct(id: string): boolean {
  const products = getCmsProducts({ includeDeleted: true });
  const idx = products.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  products[idx] = { ...products[idx], deletedAt: null, purgeAt: null };
  productsCache = products;
  return true;
}

export function hardDeleteCmsProduct(id: string): boolean {
  const products = getCmsProducts({ includeDeleted: true });
  const idx = products.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  products.splice(idx, 1);
  productsCache = products;
  return true;
}

export function bulkUpdateBySkus(params: {
  skus: string[];
  addTags?: string[];
  removeTags?: string[];
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
}): CmsProduct[] {
  const products = getCmsProducts({ includeDeleted: true });
  const skuSet = new Set(params.skus.map((sku) => sku.trim().toLowerCase()));
  const updated: CmsProduct[] = [];

  for (const product of products) {
    if (!skuSet.has(product.sku.toLowerCase())) continue;
    const nextTags = new Set(product.tags);
    (params.addTags ?? []).forEach((tag) => {
      const normalized = normalizeProductTag(tag);
      if (normalized) nextTags.add(normalized);
    });
    (params.removeTags ?? []).forEach((tag) => {
      const normalized = normalizeProductTag(tag);
      if (normalized) nextTags.delete(normalized);
    });
    const next: CmsProduct = {
      ...product,
      tags: Array.from(nextTags),
      categoryId: params.categoryId ?? product.categoryId,
      subcategoryId: params.subcategoryId ?? product.subcategoryId,
      brandId: params.brandId ?? product.brandId,
    };
    updated.push(next);
  }

  updated.forEach((item) => saveCmsProduct(item));
  return updated;
}

export function upsertCmsProducts(items: CmsProduct[]): CmsProduct[] {
  const products = getCmsProducts({ includeDeleted: true });
  const byId = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    byId.set(item.id, {
      ...item,
      enabledCountries: item.enabledCountries ?? { ...item.availability },
      deletedAt: null,
      purgeAt: null,
    });
  }

  productsCache = Array.from(byId.values());
  return items;
}
