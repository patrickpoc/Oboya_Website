import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

/**
 * A stock product being published with at least one enabled country needs a
 * positive price (product or color variant). Quote products never need one.
 */
export function stockProductNeedsPrice(
  product: Pick<
    CmsProduct,
    "saleMode" | "status" | "enabledCountries" | "availability" | "prices" | "colorVariants"
  >
): boolean {
  if (product.saleMode === "quote" || product.status !== "published") return false;
  const markets = product.enabledCountries ?? product.availability ?? {};
  if (!Object.values(markets).some(Boolean)) return false;
  const positive = (prices?: Partial<Record<string, number>>) =>
    Object.values(prices ?? {}).some((price) => Number(price) > 0);
  if (positive(product.prices)) return false;
  return !(product.colorVariants ?? []).some((variant) => positive(variant.prices));
}
