"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import type { ProductColorVariant } from "@/lib/shop/types";
import { getVariantDisplayName } from "@/lib/shop/color-variants";
import { formatShopPrice } from "@/lib/shop/format-price";

interface ColorSwatchGroupProps {
  variants: ProductColorVariant[];
  selectedId: string | null;
  onSelect: (variantId: string) => void;
  currency?: string | null;
  className?: string;
  size?: "sm" | "md";
}

export function ColorSwatchGroup({
  variants,
  selectedId,
  onSelect,
  currency,
  className,
  size = "sm",
}: ColorSwatchGroupProps) {
  const locale = useLocale();
  if (variants.length === 0) return null;

  const dim = size === "md" ? "size-7" : "size-5";

  return (
    <div
      role="radiogroup"
      aria-label="Color options"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      {variants.map((variant) => {
        const selected = variant.id === selectedId;
        const label = getVariantDisplayName(variant, locale);
        const priceLabel =
          currency && typeof variant.prices[currency] === "number"
            ? formatShopPrice(variant.prices[currency] ?? 0, currency)
            : null;
        const ariaLabel = priceLabel ? `${label} — ${priceLabel}` : label;

        return (
          <button
            key={variant.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={ariaLabel}
            title={ariaLabel}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onSelect(variant.id);
            }}
            className={cn(
              "rounded-full border border-black/10 shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-blue focus-visible:ring-offset-2",
              dim,
              selected
                ? "ring-2 ring-oboya-blue ring-offset-1"
                : "hover:ring-1 hover:ring-oboya-blue/40"
            )}
            style={{ backgroundColor: variant.color || "#888888" }}
          />
        );
      })}
    </div>
  );
}
