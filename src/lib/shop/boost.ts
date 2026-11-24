import type { ShopProduct } from "@/lib/shop/types";

export const PRODUCT_BOOST_MIN = 0;
export const PRODUCT_BOOST_MAX = 100;

/** Finite number -> trunc + clamp 0..100; anything else -> 0. */
export function normalizeBoost(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  const n = Math.trunc(value);
  return Math.min(PRODUCT_BOOST_MAX, Math.max(PRODUCT_BOOST_MIN, n)) || 0;
}

/** Empty string -> null (keep/default); valid whole number in range -> number; otherwise NaN. */
export function parseBoostInput(raw: string): number | null {
  const text = raw.trim();
  if (!text) return null;
  if (!/^\d+$/.test(text)) return Number.NaN;
  const n = Number(text);
  return n >= PRODUCT_BOOST_MIN && n <= PRODUCT_BOOST_MAX ? n : Number.NaN;
}

/** Comparator: higher boost first. */
export function compareBoostDesc(
  a: Pick<ShopProduct, "boost">,
  b: Pick<ShopProduct, "boost">
): number {
  return normalizeBoost(b.boost) - normalizeBoost(a.boost);
}
