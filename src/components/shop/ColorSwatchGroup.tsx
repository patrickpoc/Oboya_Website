"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import type { ProductColorVariant } from "@/lib/shop/types";
import { getVariantDisplayName } from "@/lib/shop/color-variants";
import { formatShopPrice } from "@/lib/shop/format-price";

const MAX_INLINE = 4;
/** Color dots shown before the +X control when overflow is needed. */
const MAX_VISIBLE_WITH_OVERFLOW = 3;

interface ColorSwatchGroupProps {
  variants: ProductColorVariant[];
  selectedId: string | null;
  onSelect: (variantId: string) => void;
  currency?: string | null;
  className?: string;
  size?: "sm" | "md";
}

function splitVariants(
  variants: ProductColorVariant[],
  selectedId: string | null
) {
  if (variants.length <= MAX_INLINE) {
    return { visible: variants, overflow: [] as ProductColorVariant[] };
  }

  const selectedIndex = variants.findIndex((v) => v.id === selectedId);
  if (selectedIndex >= MAX_VISIBLE_WITH_OVERFLOW) {
    const selected = variants[selectedIndex]!;
    const visible = [
      ...variants.slice(0, MAX_VISIBLE_WITH_OVERFLOW - 1),
      selected,
    ];
    const visibleIds = new Set(visible.map((v) => v.id));
    const overflow = variants.filter((v) => !visibleIds.has(v.id));
    return { visible, overflow };
  }

  return {
    visible: variants.slice(0, MAX_VISIBLE_WITH_OVERFLOW),
    overflow: variants.slice(MAX_VISIBLE_WITH_OVERFLOW),
  };
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
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const { visible, overflow } = useMemo(
    () => splitVariants(variants, selectedId),
    [variants, selectedId]
  );

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (variants.length === 0) return null;

  const dim = size === "md" ? "size-7" : "size-5";
  const textSize = size === "md" ? "text-[10px]" : "text-[9px]";

  const renderSwatch = (variant: ProductColorVariant) => {
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
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelect(variant.id);
          setOpen(false);
        }}
        className={cn(
          "box-border shrink-0 rounded-full border border-black/10 p-0 shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-blue focus-visible:ring-offset-2",
          dim,
          selected
            ? "ring-2 ring-oboya-blue ring-offset-1"
            : "hover:ring-1 hover:ring-oboya-blue/40"
        )}
        style={{ backgroundColor: variant.color || "#888888" }}
      />
    );
  };

  return (
    <div
      ref={rootRef}
      role="radiogroup"
      aria-label="Color options"
      className={cn("relative flex flex-nowrap items-center gap-1.5", className)}
    >
      {visible.map(renderSwatch)}

      {overflow.length > 0 ? (
        <div className={cn("relative shrink-0", dim)}>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`Show ${overflow.length} more colors`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen((prev) => !prev);
            }}
            className={cn(
              "box-border flex size-full items-center justify-center rounded-full border border-black/10 bg-oboya-soft-white p-0 font-semibold leading-none tabular-nums text-oboya-blue-dark shadow-sm transition-colors",
              "hover:border-oboya-blue/40 hover:bg-white hover:ring-1 hover:ring-oboya-blue/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-blue focus-visible:ring-offset-2",
              textSize,
              open && "border-oboya-blue ring-1 ring-oboya-blue/30"
            )}
          >
            +{overflow.length}
          </button>

          {open ? (
            <div
              id={panelId}
              role="group"
              aria-label="More color options"
              className="absolute top-full left-1/2 z-20 mt-1.5 flex -translate-x-1/2 flex-wrap content-start gap-1.5 rounded-lg border border-border/60 bg-white p-1.5 shadow-[var(--shadow-card)]"
              style={{ width: "max-content", maxWidth: "9.5rem" }}
            >
              {overflow.map(renderSwatch)}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
