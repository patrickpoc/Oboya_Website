import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

function nameValues(product: CmsProduct): string[] {
  return Object.values(product.name ?? {})
    .filter(Boolean)
    .map((value) => value.toLowerCase());
}

function rankMatch(product: CmsProduct, query: string): number | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const sku = product.sku.toLowerCase();
  const names = nameValues(product);

  if (sku === q) return 1;
  if (sku.startsWith(q)) return 2;
  if (names.some((name) => name === q)) return 3;
  if (names.some((name) => name.startsWith(q))) return 4;
  if (sku.includes(q)) return 5;
  if (names.some((name) => name.includes(q))) return 6;

  const variantHit = (product.colorVariants ?? []).some((variant) => {
    const vSku = (variant.sku || "").toLowerCase();
    return vSku === q || vSku.startsWith(q) || vSku.includes(q);
  });
  if (variantHit) return 7;

  return null;
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
  const limit = options?.limit ?? 3;
  const exclude = options?.excludeIds;
  const q = query.trim();
  if (q.length < 2) return [];

  const scored = products
    .filter((product) => !exclude?.has(product.id) && !product.deletedAt)
    .map((product) => {
      const rank = rankMatch(product, q);
      return rank === null ? null : { product, rank, sku: product.sku.toLowerCase() };
    })
    .filter((entry): entry is { product: CmsProduct; rank: number; sku: string } => entry !== null)
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.sku.localeCompare(b.sku);
    });

  return scored.slice(0, limit).map((entry) => entry.product);
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
