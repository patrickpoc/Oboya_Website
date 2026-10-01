/**
 * Data Cache tags for public Supabase reads. Writes invalidate only the tags
 * they affect, so a blog save never regenerates the shop (and vice versa).
 */

/** Attached to every public read; reserved for manual full purges. */
export const PUBLIC_DATA_TAG = "cms-documents";

/** Published product list (shop catalog endpoint, sitemap). */
export const CATALOG_TAG = "catalog";

/** Every product read (list and detail) — for changes touching all products. */
export const ALL_PRODUCTS_TAG = "products";

export const MAP_LOCATIONS_TAG = "map-locations";

/**
 * Safety-net TTL for cached public data. Freshness comes from on-demand tag
 * invalidation on every write; this only bounds drift if a write path is missed.
 */
export const PUBLIC_DATA_REVALIDATE_SECONDS = 86400;

export function docTag(docId: string) {
  return `cms-doc:${docId}`;
}

/** Products are addressed by id or SKU (case-insensitive) in URLs. */
export function productTag(key: string) {
  return `product:${key.trim().toLowerCase()}`;
}
