"use client";

import { CountryFlag } from "@/components/ui/country-flag";
import { pickLocalizedLabel } from "@/lib/shop/localized-label";
import type { ShopBrand } from "@/lib/shop/types";
import { cn } from "@/lib/utils";

type BrandLabelBrand = Pick<ShopBrand, "name" | "nameI18n" | "flag">;

interface BrandLabelProps {
  brand?: BrandLabelBrand | null;
  locale?: string;
  className?: string;
  textClassName?: string;
}

export function BrandLabel({
  brand,
  locale = "en",
  className,
  textClassName,
}: BrandLabelProps) {
  if (!brand) return null;

  const name = pickLocalizedLabel(locale, brand.name, brand.nameI18n);
  const flag = brand.flag?.trim();

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      {flag ? (
        <span
          className="inline-flex h-[0.9em] w-[1.35em] shrink-0 overflow-hidden rounded-[2px] border border-border/40 leading-none"
          aria-hidden
        >
          <CountryFlag code={flag} className="block h-full w-full" />
        </span>
      ) : null}
      <span className={cn("truncate", textClassName)}>{name}</span>
    </span>
  );
}
