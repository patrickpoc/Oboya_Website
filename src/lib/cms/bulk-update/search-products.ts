import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { SkuLookupHit } from "@/lib/cms/admin-sku-lookup";
import { getVariantDisplayName } from "@/lib/shop/color-variants";

function nameValues(product: CmsProduct): string[] {
  return Object.values(product.name ?? {})
    .filter(Boolean)
    .map((value) => value.toLowerCase());
}

export type BulkSkuSearchHit = SkuLookupHit & {
  rank: number;
  isChildSku: boolean;
};

function rankMatch(product: CmsProduct, query: string): BulkSkuSearchHit | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const sku = product.sku.toLowerCase();
  const names = nameValues(product);

  if (sku === q) {
    return {
      product,
      matchedSku: product.sku,
      variantId: null,
      rank: 1,
      isChildSku: false,
    };
  }

  for (const variant of product.colorVariants ?? []) {
    const vSku = (variant.sku || "").toLowerCase();
    if (vSku === q) {
      return {
        product,
        matchedSku: variant.sku,
        variantId: variant.id,
        rank: 1,
        isChildSku: true,
      };
    }
  }

  if (sku.startsWith(q)) {
    return {
      product,
      matchedSku: product.sku,
      variantId: null,
      rank: 2,
      isChildSku: false,
    };
  }

  for (const variant of product.colorVariants ?? []) {
    const vSku = (variant.sku || "").toLowerCase();
    if (vSku.startsWith(q)) {
      return {
        product,
        matchedSku: variant.sku,
        variantId: variant.id,
        rank: 2,
        isChildSku: true,
      };
    }
  }

  if (names.some((name) => name === q)) {
    return {
      product,
      matchedSku: product.sku,
      variantId: null,
      rank: 3,
      isChildSku: false,
    };
  }
  if (names.some((name) => name.startsWith(q))) {
    return {
      product,
      matchedSku: product.sku,
      variantId: null,
      rank: 4,
      isChildSku: false,
    };
  }
  if (sku.includes(q)) {
    return {
      product,
      matchedSku: product.sku,
      variantId: null,
      rank: 5,
      isChildSku: false,
    };
  }
  if (names.some((name) => name.includes(q))) {
    return {
      product,
      matchedSku: product.sku,
      variantId: null,
      rank: 6,
      isChildSku: false,
    };
  }

  for (const variant of product.colorVariants ?? []) {
    const vSku = (variant.sku || "").toLowerCase();
    if (vSku.includes(q)) {
      return {
        product,
        matchedSku: variant.sku,
        variantId: variant.id,
        rank: 7,
        isChildSku: true,
      };
    }
    const colorName = getVariantDisplayName(variant, "en").toLowerCase();
    if (colorName && colorName.includes(q)) {
      return {
        product,
        matchedSku: variant.sku || product.sku,
        variantId: variant.id,
        rank: 7,
        isChildSku: true,
      };
    }
  }

  return null;
}

/**
 * Ranked multilingual product search for Bulk Update autocomplete.
 * Returns up to `limit` hits (default 3). Child SKU matches include a hint.
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
    .map((product) => rankMatch(product, q))
    .filter((entry): entry is BulkSkuSearchHit => entry !== null)
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.matchedSku.toLowerCase().localeCompare(b.matchedSku.toLowerCase());
    });

  // Dedupe by product id — keep best-ranked hit per product.
  const seen = new Set<string>();
  const unique: BulkSkuSearchHit[] = [];
  for (const hit of scored) {
    if (seen.has(hit.product.id)) continue;
    seen.add(hit.product.id);
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
  return searchSkuHitsForBulkUpdate(products, query, options).map((hit) => hit.product);
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
