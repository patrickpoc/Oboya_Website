import { getEffectiveSaleMode } from "@/lib/shop/sale-mode";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

export function toPublicProduct(product: CmsProduct) {
  const { deletedAt: _deletedAt, purgeAt: _purgeAt, ...rest } = product;
  if (getEffectiveSaleMode(rest) !== "quote") return rest;
  // Quote products are "price on request": never expose stored prices publicly.
  return {
    ...rest,
    prices: {},
    colorVariants: rest.colorVariants?.map((variant) => ({ ...variant, prices: {} })),
  };
}
