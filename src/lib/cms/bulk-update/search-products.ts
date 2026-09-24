import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { SkuLookupHit } from "@/lib/cms/admin-sku-lookup";
import {
  getVariantDisplayName,
  resolveVariantImage,
} from "@/lib/shop/color-variants";
import type { ProductColorVariant } from "@/lib/shop/types";

function nameValues(product: CmsProduct): string[] {
  return Object.values(product.name ?? {})
    .filter(Boolean)
    .map((value) => value.toLowerCase());
}

function colorNameValues(variant: ProductColorVariant): string[] {
  const fromI18n = Object.values(variant.nameI18n ?? {})
    .filter(Boolean)
    .map((value) => value.toLowerCase().trim());
  const fallback = (variant.name || "").toLowerCase().trim();
  const values = [...fromI18n];
  if (fallback && !values.includes(fallback)) values.push(fallback);
  return values.filter(Boolean);
}

export type BulkSkuSearchHit = SkuLookupHit & {
  rank: number;
  isChildSku: boolean;
};

function parentHit(
  product: CmsProduct,
  rank: number
): BulkSkuSearchHit {
  return {
    product,
    matchedSku: product.sku,
    variantId: null,
    rank,
    isChildSku: false,
  };
}

function childHit(
  product: CmsProduct,
  variant: ProductColorVariant,
  rank: number
): BulkSkuSearchHit {
  return {
    product,
    matchedSku: variant.sku || product.sku,
    variantId: variant.id,
    rank,
    isChildSku: true,
  };
}

/**
 * Collect every parent / color match for a query (exact → prefix → contains),
 * for SKU and localized names.
 */
function collectMatches(product: CmsProduct, query: string): BulkSkuSearchHit[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const hits: BulkSkuSearchHit[] = [];
  const sku = product.sku.toLowerCase();
  const names = nameValues(product);

  if (sku === q) hits.push(parentHit(product, 1));
  else if (sku.startsWith(q)) hits.push(parentHit(product, 2));
  else if (names.some((name) => name === q)) hits.push(parentHit(product, 3));
  else if (names.some((name) => name.startsWith(q))) hits.push(parentHit(product, 4));
  else if (sku.includes(q)) hits.push(parentHit(product, 5));
  else if (names.some((name) => name.includes(q))) hits.push(parentHit(product, 6));

  for (const variant of product.colorVariants ?? []) {
    const vSku = (variant.sku || "").toLowerCase();
    const colorNames = colorNameValues(variant);

    if (vSku && vSku === q) {
      hits.push(childHit(product, variant, 1));
      continue;
    }
    if (colorNames.some((name) => name === q)) {
      hits.push(childHit(product, variant, 3));
      continue;
    }
    if (vSku && vSku.startsWith(q)) {
      hits.push(childHit(product, variant, 2));
      continue;
    }
    if (colorNames.some((name) => name.startsWith(q))) {
      hits.push(childHit(product, variant, 4));
      continue;
    }
    if (vSku && vSku.includes(q)) {
      hits.push(childHit(product, variant, 5));
      continue;
    }
    if (colorNames.some((name) => name.includes(q))) {
      hits.push(childHit(product, variant, 6));
    }
  }

  return hits;
}

/**
 * Ranked multilingual product + color-variant search for Bulk Update autocomplete.
 * Returns up to `limit` hits (default 3). Child SKU / color-name matches include variantId.
 */
export function searchSkuHitsForBulkUpdate(
  products: CmsProduct[],
  query: string,
  options?: { limit?: number; excludeIds?: Set<string> }
): BulkSkuSearchHit[] {
  const limit = options?.limit ?? 3;
  const exclude = options?.excludeIds;
  const q = query.trim();
  if (q.length < 2) return [];

  const scored = products
    .filter((product) => !exclude?.has(product.id) && !product.deletedAt)
    .flatMap((product) => collectMatches(product, q))
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.matchedSku.toLowerCase().localeCompare(b.matchedSku.toLowerCase());
    });

  // Dedupe by product + variant (parent uses null variantId).
  const seen = new Set<string>();
  const unique: BulkSkuSearchHit[] = [];
  for (const hit of scored) {
    const key = `${hit.product.id}::${hit.variantId ?? "__parent__"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(hit);
    if (unique.length >= limit) break;
  }
  return unique;
}

/**
 * Ranked multilingual product search for Bulk Update autocomplete.
 * Returns up to `limit` products (default 3).
 */
export function searchProductsForBulkUpdate(
  products: CmsProduct[],
  query: string,
  options?: { limit?: number; excludeIds?: Set<string> }
): CmsProduct[] {
  const seen = new Set<string>();
  const productsOut: CmsProduct[] = [];
  for (const hit of searchSkuHitsForBulkUpdate(products, query, options)) {
    if (seen.has(hit.product.id)) continue;
    seen.add(hit.product.id);
    productsOut.push(hit.product);
  }
  return productsOut;
}

export function displayProductName(product: CmsProduct, preferredLocale = "en"): string {
  const name = product.name;
  if (!name) return product.sku;
  return (
    name[preferredLocale as keyof typeof name] ||
    name.en ||
    name["pt-BR"] ||
    name.es ||
    name["zh-CN"] ||
    product.sku
  );
}

/** Label for autocomplete / workspace: product name, or "Product — Color" for variants. */
export function displaySearchHitLabel(
  hit: BulkSkuSearchHit,
  preferredLocale = "en"
): string {
  const productName = displayProductName(hit.product, preferredLocale);
  if (!hit.isChildSku || !hit.variantId) return productName;
  const variant = (hit.product.colorVariants ?? []).find(
    (item) => item.id === hit.variantId
  );
  if (!variant) return productName;
  const colorName = getVariantDisplayName(variant, preferredLocale).trim();
  if (!colorName) return productName;
  return `${productName} — ${colorName}`;
}

/** Thumbnail for a search hit: color image when matching a variant. */
export function displaySearchHitImage(hit: BulkSkuSearchHit): string {
  if (hit.isChildSku && hit.variantId) {
    const variant = (hit.product.colorVariants ?? []).find(
      (item) => item.id === hit.variantId
    );
    return resolveVariantImage(hit.product, variant ?? null);
  }
  return hit.product.images?.[0]?.trim() || "";
}
