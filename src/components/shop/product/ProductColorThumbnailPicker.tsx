"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { cn } from "@/lib/utils";
import type { ProductColorVariant, ShopProduct } from "@/lib/shop/types";
import {
  getVariantDisplayName,
  resolveVariantImage,
  resolveVariantPrice,
} from "@/lib/shop/color-variants";
import { formatShopPrice } from "@/lib/shop/format-price";

interface ProductColorThumbnailPickerProps {
  product: Pick<
    ShopProduct,
    | "sku"
    | "images"
    | "imageColorIds"
    | "colorVariants"
    | "defaultColor"
    | "defaultColorName"
    | "prices"
  >;
  variants: ProductColorVariant[];
  selectedId: string | null;
  onSelect: (variantId: string) => void;
  label: string;
  className?: string;
}

/**
 * PDP color picker: square product thumbnails with the color name + price below each box.
 * Listing pages keep the circular swatches in `ColorSwatchGroup`.
 */
export function ProductColorThumbnailPicker({
  product,
  variants,
  selectedId,
  onSelect,
  label,
  className,
}: ProductColorThumbnailPickerProps) {
  const locale = useLocale();
  const { currency } = useShop();
  if (variants.length === 0) return null;

  return (
    <div className={cn(className)}>
      <p className="text-sm font-medium text-oboya-blue-dark">{label}</p>
      <div
        role="radiogroup"
        aria-label={label}
        className="mt-3 flex flex-wrap gap-3"
      >
        {variants.map((variant) => {
          const selected = variant.id === selectedId;
          const name = getVariantDisplayName(variant, locale);
          const imageSrc = resolveVariantImage(product, variant);
          const price = currency
            ? resolveVariantPrice(product, variant, currency)
            : 0;
          const priceLabel = currency
            ? formatShopPrice(price, currency)
            : null;

          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={priceLabel ? `${name}, ${priceLabel}` : name}
              onClick={() => onSelect(variant.id)}
              className={cn(
                "group flex w-[5.25rem] flex-col items-center gap-1 text-center",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-blue focus-visible:ring-offset-2"
              )}
            >
              <span
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-md bg-oboya-soft-white ring-1 transition-shadow",
                  selected
                    ? "ring-2 ring-oboya-blue ring-offset-1"
                    : "ring-oboya-blue-dark/10 group-hover:ring-oboya-blue/40"
                )}
              >
                <Image
                  src={imageSrc}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="84px"
                />
              </span>
              <span className="flex w-full flex-col gap-0.5">
                <span
                  className={cn(
                    "w-full truncate font-body text-xs leading-tight",
                    selected
                      ? "font-medium text-oboya-blue-dark"
                      : "text-muted-foreground group-hover:text-oboya-blue-dark"
                  )}
                >
                  {name}
                </span>
                {priceLabel ? (
                  <span
                    className={cn(
                      "w-full font-body text-[0.65rem] leading-tight tabular-nums",
                      selected
                        ? "font-medium text-oboya-blue"
                        : "text-muted-foreground group-hover:text-oboya-blue-dark"
                    )}
                  >
                    {priceLabel}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
