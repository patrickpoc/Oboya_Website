import type { ShopProduct } from "@/lib/shop/types";

export const MAX_QUANTITY = 999_999;
export const QUICK_INCREMENTS = [100, 1000, 10_000] as const;

export function getProductMoq(product: ShopProduct | null | undefined): number {
  return product?.moq ?? 1;
}

export function clampQuantity(quantity: number, moq = 1): number {
  if (!Number.isFinite(quantity)) return moq;
  return Math.max(moq, Math.min(MAX_QUANTITY, Math.round(quantity)));
}
