import { resolveCatalogPrice, resolveVariantPrice } from "@/lib/shop/color-variants";
import type {
  CurrencyCode,
  ProductColorVariant,
  SaleMode,
  ShopProduct,
} from "@/lib/shop/types";

export const SALE_MODES: readonly SaleMode[] = ["stock", "quote"];

type SaleModeProduct = Pick<
  ShopProduct,
  "saleMode" | "unlimitedStock" | "stockQuantity"
>;

/** "quote" when set explicitly or when a limited-stock product has no stock. */
export function getEffectiveSaleMode(product: SaleModeProduct): SaleMode {
  if (product.saleMode === "quote") return "quote";
  if (!product.unlimitedStock && (product.stockQuantity ?? 0) <= 0) return "quote";
  return "stock";
}

export function isPricedLine(
  product: SaleModeProduct & Pick<ShopProduct, "prices">,
  variant: ProductColorVariant | null | undefined,
  currency: CurrencyCode
): boolean {
  return (
    getEffectiveSaleMode(product) === "stock" &&
    resolveVariantPrice(product, variant, currency) > 0
  );
}

/** Stock product with no price in the currency: the server rejects it, so the UI must not offer it. */
export function isUnavailableLine(
  product: SaleModeProduct & Pick<ShopProduct, "prices">,
  variant: ProductColorVariant | null | undefined,
  currency: CurrencyCode
): boolean {
  return (
    getEffectiveSaleMode(product) === "stock" &&
    resolveVariantPrice(product, variant, currency) <= 0
  );
}

/** Catalog price, or null for quote products (never display a price for them). */
export function getCatalogPriceOrNull(
  product: SaleModeProduct & Pick<ShopProduct, "prices" | "colorVariants">,
  currency: CurrencyCode
): number | null {
  if (getEffectiveSaleMode(product) === "quote") return null;
  return resolveCatalogPrice(product, currency);
}
