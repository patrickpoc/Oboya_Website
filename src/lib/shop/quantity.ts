import type { ShopProduct } from "@/lib/shop/types";
import {
  getActiveVariant,
  isDefaultColorVariantId,
  resolveVariantMoq,
} from "@/lib/shop/color-variants";

export const MAX_QUANTITY = 999_999;
export const QUICK_INCREMENTS = [100, 1000, 10_000] as const;

export function getProductMoq(
  product: ShopProduct | null | undefined,
  variantId?: string | null
): number {
  if (!product) return 1;
  if (variantId == null || isDefaultColorVariantId(variantId)) {
    return resolveVariantMoq(product, null);
  }
  const variant = getActiveVariant(product, variantId);
  return resolveVariantMoq(product, variant);
}

export function clampQuantity(
  quantity: number,
  moq = 1,
  maxQuantity = MAX_QUANTITY
): number {
  if (!Number.isFinite(quantity)) return moq;
  const max = Math.max(moq, Math.min(MAX_QUANTITY, maxQuantity));
  return Math.max(moq, Math.min(max, Math.round(quantity)));
}

export function getProductMaxQuantity(
  product: ShopProduct | null | undefined,
  variantId?: string | null
): number {
  const moq = getProductMoq(product, variantId);
  if (!product || product.unlimitedStock) return MAX_QUANTITY;
  if (product.stockQuantity != null && product.stockQuantity > 0) {
    return Math.max(moq, product.stockQuantity);
  }
  return MAX_QUANTITY;
}
