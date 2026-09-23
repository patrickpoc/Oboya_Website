/**
 * Product / variant id remaps after `id === sku` migration.
 * Cart hydrate and soft-open bookmarks use this to rewrite legacy ids.
 */
import remapData from "@/../data/shop/product-id-remap.json";

export type ProductIdRemapFile = {
  generatedAt: string;
  products: Record<string, string>;
  variants: Record<string, string>;
};

const remap: ProductIdRemapFile = {
  generatedAt: (remapData as ProductIdRemapFile).generatedAt ?? "",
  products: (remapData as ProductIdRemapFile).products ?? {},
  variants: (remapData as ProductIdRemapFile).variants ?? {},
};

export function loadProductIdRemap(): ProductIdRemapFile {
  return remap;
}

export function remapProductId(productId: string): string {
  return remap.products[productId] ?? productId;
}

export function remapVariantId(variantId: string | null | undefined): string | null {
  if (!variantId) return null;
  return remap.variants[variantId] ?? variantId;
}

export function remapCartLine(item: {
  productId: string;
  variantId?: string | null;
  quantity: number;
}): { productId: string; variantId: string | null; quantity: number } {
  return {
    productId: remapProductId(item.productId),
    variantId: remapVariantId(item.variantId ?? null),
    quantity: item.quantity,
  };
}
