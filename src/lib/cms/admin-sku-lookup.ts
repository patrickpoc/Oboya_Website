import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { sortedColorVariants } from "@/lib/shop/color-variants";

export type SkuLookupHit = {
  product: CmsProduct;
  matchedSku: string;
  /** null = base / parent SKU (`product.sku`). */
  variantId: string | null;
};

export type SkuCollision = {
  sku: string;
  productIds: string[];
};

export type ExpandedSkuRow = {
  kind: "parent" | "variant";
  productId: string;
  matchedSku: string;
  variantId: string | null;
  sortOrder: number;
};

function normalizeSku(sku: string): string {
  return sku.trim().toLowerCase();
}

/**
 * Index every sellable SKU (parent `product.sku` + each `colorVariants[].sku`).
 * Later duplicates win the map entry but are also reported via `findSkuCollisions`.
 */
export function buildSkuIndex(
  products: CmsProduct[]
): Map<string, SkuLookupHit> {
  const index = new Map<string, SkuLookupHit>();
  for (const product of products) {
    if (product.deletedAt) continue;
    const parentSku = product.sku?.trim() ?? "";
    if (parentSku) {
      index.set(normalizeSku(parentSku), {
        product,
        matchedSku: parentSku,
        variantId: null,
      });
    }
    for (const variant of sortedColorVariants(product)) {
      const childSku = variant.sku?.trim() ?? "";
      if (!childSku) continue;
      index.set(normalizeSku(childSku), {
        product,
        matchedSku: childSku,
        variantId: variant.id,
      });
    }
  }
  return index;
}

/** Resolve a parent or child SKU to its product document. */
export function resolveSku(
  products: CmsProduct[] | Map<string, SkuLookupHit>,
  sku: string
): SkuLookupHit | null {
  const key = normalizeSku(sku);
  if (!key) return null;
  if (products instanceof Map) {
    return products.get(key) ?? null;
  }
  return buildSkuIndex(products).get(key) ?? null;
}

/** Every SKU string across parent products and color children (lowercased). */
export function collectAllSkus(
  products: CmsProduct[],
  options?: { includeDeleted?: boolean; includeLegacyIds?: boolean }
): Set<string> {
  const skus = new Set<string>();
  for (const product of products) {
    if (!options?.includeDeleted && product.deletedAt) continue;
    const parent = product.sku?.trim();
    if (parent) skus.add(normalizeSku(parent));
    if (options?.includeLegacyIds && product.id?.trim()) {
      skus.add(normalizeSku(product.id));
    }
    for (const variant of product.colorVariants ?? []) {
      const child = variant.sku?.trim();
      if (child) skus.add(normalizeSku(child));
    }
  }
  return skus;
}

/** Detect the same SKU claimed by more than one product document. */
export function findSkuCollisions(products: CmsProduct[]): SkuCollision[] {
  const owners = new Map<string, Set<string>>();
  for (const product of products) {
    if (product.deletedAt) continue;
    const register = (raw: string) => {
      const key = normalizeSku(raw);
      if (!key) return;
      const set = owners.get(key) ?? new Set<string>();
      set.add(product.id);
      owners.set(key, set);
    };
    register(product.sku ?? "");
    for (const variant of product.colorVariants ?? []) {
      register(variant.sku ?? "");
    }
  }
  const collisions: SkuCollision[] = [];
  for (const [sku, productIds] of owners) {
    if (productIds.size > 1) {
      collisions.push({ sku, productIds: Array.from(productIds).sort() });
    }
  }
  return collisions.sort((a, b) => a.sku.localeCompare(b.sku));
}

/**
 * Ordered UI group: parent row first, then color children by `sortOrder`.
 */
export function expandSkuGroup(product: CmsProduct): ExpandedSkuRow[] {
  const parentSku = product.sku?.trim() || product.id;
  const rows: ExpandedSkuRow[] = [
    {
      kind: "parent",
      productId: product.id,
      matchedSku: parentSku,
      variantId: null,
      sortOrder: -1,
    },
  ];
  for (const variant of sortedColorVariants(product)) {
    rows.push({
      kind: "variant",
      productId: product.id,
      matchedSku: variant.sku?.trim() || variant.id,
      variantId: variant.id,
      sortOrder: variant.sortOrder,
    });
  }
  return rows;
}

export function countProductGroups(
  rows: Array<{ productId: string }>
): number {
  return new Set(rows.map((row) => row.productId)).size;
}
