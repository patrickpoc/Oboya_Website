"use client";

import Image from "next/image";
import { memo, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BrandLabel } from "@/components/shop/BrandLabel";
import { ColorSwatchGroup } from "@/components/shop/ColorSwatchGroup";
import { buttonVariants } from "@/components/ui/button";
import { getBrandById, getCategoryById } from "@/lib/shop/catalog";
import {
  DEFAULT_COLOR_VARIANT_ID,
  getActiveVariant,
  getDisplayColorVariants,
  hasColorVariants,
  resolveVariantImage,
  resolveVariantPrice,
  resolveVariantSku,
  toCartVariantId,
} from "@/lib/shop/color-variants";
import { useProductName } from "@/lib/shop/use-product-name";
import { useProductDescription } from "@/lib/shop/use-product-description";
import type { ShopProduct } from "@/lib/shop/types";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { formatShopPrice } from "@/lib/shop/format-price";

interface ProductCardProps {
  product: ShopProduct;
  currency: string;
  viewMode?: "grid" | "list";
  onAddToQuote: (variantId?: string | null) => void;
}

function ProductCardComponent({
  product,
  currency,
  viewMode = "grid",
  onAddToQuote,
}: ProductCardProps) {
  const t = useTranslations("shop");
  const locale = useLocale();
  const getProductName = useProductName();
  const { getShortDescription } = useProductDescription();
  const name = getProductName(product as Parameters<typeof getProductName>[0]);
  const shortDescription = getShortDescription(
    (product as CmsProduct).shortDescription
  );
  const brand = getBrandById(product.brandId);
  const category = getCategoryById(product.categoryId);
  const variants = useMemo(() => getDisplayColorVariants(product), [product]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    () => (variants[0]?.id ?? null)
  );
  const activeVariant = getActiveVariant(product, selectedVariantId);
  const price = resolveVariantPrice(product, activeVariant, currency);
  const imageSrc = resolveVariantImage(product, activeVariant);
  const displaySku = resolveVariantSku(product, activeVariant);
  const showSwatches = hasColorVariants(product);
  const cartVariantId = toCartVariantId(activeVariant?.id);
  const detailHref = `/shop/products/${product.id}${
    cartVariantId ? `?variant=${encodeURIComponent(cartVariantId)}` : ""
  }`;

  if (viewMode === "list") {
    return (
      <article className="flex flex-col gap-4 rounded-xl border border-border/60 bg-white p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md sm:flex-row">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-oboya-soft-white sm:aspect-auto sm:size-24">
          <Image
            src={imageSrc}
            alt={name}
            fill
            className="object-cover transition-opacity duration-200"
            sizes="(max-width: 640px) 100vw, 96px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-oboya-green">
              {category?.name}
            </p>
          </div>
          <h3 className="mt-0.5 leading-snug font-semibold text-oboya-blue-dark">
            {name}
          </h3>
          {showSwatches ? (
            <ColorSwatchGroup
              className="mt-1.5"
              variants={variants}
              selectedId={activeVariant?.id ?? DEFAULT_COLOR_VARIANT_ID}
              onSelect={setSelectedVariantId}
              currency={currency}
            />
          ) : null}
          {shortDescription ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {shortDescription}
            </p>
          ) : null}
          <p className="mt-1 flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
            <span>{displaySku}</span>
            {brand ? (
              <>
                <span aria-hidden>·</span>
                <BrandLabel brand={brand} locale={locale} />
              </>
            ) : null}
          </p>
          <p className="mt-2 text-sm font-semibold text-oboya-blue-dark">
            {t("estimatedPrice")}: {formatShopPrice(price, currency)}
          </p>
          <p className="text-[11px] text-oboya-green">
            {t("moq", { count: product.moq })}
          </p>
        </div>
        <div className="flex shrink-0 flex-col justify-center gap-2 sm:min-w-[10rem]">
          <button
            type="button"
            onClick={() => onAddToQuote(cartVariantId)}
            className={buttonVariants({
              size: "cta",
              className: "w-full bg-oboya-green text-white hover:bg-oboya-green/90",
            })}
          >
            {t("addToQuote")}
          </button>
          <Link
            href={detailHref}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "w-full rounded-full",
            })}
          >
            {t("moreInformation")}
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-white shadow-[var(--shadow-card)] transition-shadow hover:-translate-y-0.5 hover:shadow-md">
      <Link href={detailHref} className="relative aspect-[5/4] bg-oboya-soft-white">
        <Image
          key={imageSrc}
          src={imageSrc}
          alt={name}
          fill
          className="object-cover transition-opacity duration-200 group-hover:opacity-95"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2.5 sm:p-3.5">
        {category ? (
          <p className="text-[10px] font-medium uppercase tracking-wide text-oboya-green">
            {category.name}
          </p>
        ) : null}
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-oboya-blue-dark sm:text-[0.9375rem]">
          <Link href={detailHref} className="hover:text-oboya-blue">
            {name}
          </Link>
        </h3>
        {displaySku ? (
          <p className="truncate text-[11px] text-muted-foreground">{displaySku}</p>
        ) : null}
        {brand ? (
          <p className="truncate text-[11px] text-muted-foreground">
            <BrandLabel brand={brand} locale={locale} />
          </p>
        ) : null}
        {showSwatches ? (
          <ColorSwatchGroup
            className="mt-0.5"
            variants={variants}
            selectedId={activeVariant?.id ?? DEFAULT_COLOR_VARIANT_ID}
            onSelect={setSelectedVariantId}
            currency={currency}
          />
        ) : (
          <div className="flex min-h-5 flex-1 items-center" aria-hidden>
            <div className="h-px w-full bg-oboya-blue/25" />
          </div>
        )}
        <div className={showSwatches ? "mt-auto space-y-0.5 pt-2" : "space-y-0.5"}>
          <p className="text-base font-semibold tabular-nums text-oboya-blue-dark">
            {formatShopPrice(price, currency)}
          </p>
          <p className="text-[11px] leading-tight text-oboya-green">
            {t("moq", { count: product.moq })}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 pt-2.5">
          <button
            type="button"
            onClick={() => onAddToQuote(cartVariantId)}
            className={buttonVariants({
              size: "sm",
              className:
                "h-8 w-full rounded-full bg-oboya-green text-xs font-semibold text-white hover:bg-oboya-green/90",
            })}
          >
            {t("addToQuote")}
          </button>
          <Link
            href={detailHref}
            className={buttonVariants({
              variant: "outline",
              size: "xs",
              className: "h-7 w-full rounded-full text-[11px]",
            })}
          >
            {t("moreInformation")}
          </Link>
        </div>
      </div>
    </article>
  );
}

export const ProductCard = memo(ProductCardComponent);
