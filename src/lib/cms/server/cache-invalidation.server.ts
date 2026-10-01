import "server-only";

import { revalidateTag } from "next/cache";
import {
  ALL_PRODUCTS_TAG,
  CATALOG_TAG,
  MAP_LOCATIONS_TAG,
  docTag,
  productTag,
} from "@/lib/cms/cache-tags";

/**
 * `expire: 0` instead of the "max" profile: admins expect the very next page
 * load after a save to show the new data, not a stale copy while it regenerates.
 */
const IMMEDIATE = { expire: 0 };

function bust(tag: string) {
  try {
    revalidateTag(tag, IMMEDIATE);
  } catch (error) {
    // Outside a request scope (scripts/tests) there is no cache to bust.
    console.error(`revalidateTag(${tag}) skipped:`, error instanceof Error ? error.message : error);
  }
}

export function invalidateDocument(docId: string) {
  bust(docTag(docId));
}

/**
 * One or more products changed: their detail pages plus the catalog list.
 * Batched writers pass `catalog: false` and call `invalidateCatalog()` once.
 */
export function invalidateProducts(
  keys: Array<string | null | undefined>,
  options: { catalog?: boolean } = {}
) {
  const unique = new Set(
    keys.map((key) => key?.trim().toLowerCase()).filter((key): key is string => Boolean(key))
  );
  for (const key of unique) bust(productTag(key));
  if (options.catalog !== false) bust(CATALOG_TAG);
}

export function invalidateCatalog() {
  bust(CATALOG_TAG);
}

/** Changes that affect every product (bulk imports, currency normalization). */
export function invalidateAllProducts() {
  bust(ALL_PRODUCTS_TAG);
  bust(CATALOG_TAG);
}

export function invalidateMapLocations() {
  bust(MAP_LOCATIONS_TAG);
}
