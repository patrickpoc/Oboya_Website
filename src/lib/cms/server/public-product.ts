import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

export function toPublicProduct(product: CmsProduct) {
  const { deletedAt: _deletedAt, purgeAt: _purgeAt, ...rest } = product;
  return rest;
}
