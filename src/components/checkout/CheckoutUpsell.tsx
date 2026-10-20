"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useShop } from "@/contexts/ShopContext";
import { useHorizontalCarousel } from "@/hooks/useHorizontalCarousel";
import { getShopCatalog } from "@/lib/shop/catalog";
import {
  DEFAULT_COLOR_VARIANT_ID,
  getActiveVariant,
  getFeaturedColorVariantId,
  resolveVariantImage,
  resolveVariantPrice,
  resolveVariantSku,
  toCartVariantId,
} from "@/lib/shop/color-variants";
import { formatShopPrice } from "@/lib/shop/format-price";
import { getProductMoq } from "@/lib/shop/quantity";
import { getEffectiveSaleMode } from "@/lib/shop/sale-mode";
import { useProductName } from "@/lib/shop/use-product-name";
import { cn } from "@/lib/utils";

const FALLBACK_IMAGE = "/assets/homepage/greenhouse-technology.webp";
const UPSELL_LIMIT = 9;
const GAP = 16;
/** Matches the viewport's px-4 so card shadows are not clipped by overflow-hidden. */
const SHADOW_BLEED = 16;

function cardsPerView(width: number) {
  if (width < 640) return 1.15;
  if (width < 1024) return 2.2;
  return 3.15;
}

export function CheckoutUpsell({ popularProductIds }: { popularProductIds: string[] }) {
  const t = useTranslations("checkout");
  const tShop = useTranslations("shop");
  const { catalogReady, countryCode, currency, getLineItems, getProductById, openAddToQuoteDialog } =
    useShop();
  const getProductName = useProductName();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [perView, setPerView] = useState(3.15);
  const [cardWidth, setCardWidth] = useState(0);

  const lineKey = getLineItems()
    .map((item) => item.productId)
    .join(",");

  const products = useMemo(() => {
    if (!catalogReady || !countryCode || !currency) return [];

    const lines = getLineItems();
    const inQuote = new Set(lines.map((item) => item.productId));
    const subcategories = new Set<string>();
    const categories = new Set<string>();

    for (const line of lines) {
      const quoted = getProductById(line.productId);
      if (!quoted) continue;
      if (quoted.subcategoryId) subcategories.add(quoted.subcategoryId);
      if (quoted.categoryId) categories.add(quoted.categoryId);
    }

    const popularRank = new Map(popularProductIds.map((id, index) => [id, index]));

    const ranked = getShopCatalog()
      .products.filter((product) => {
        const enabled = product.enabledCountries ?? product.availability;
        if (!enabled[countryCode]) return false;
        if (inQuote.has(product.id)) return false;
        if (getEffectiveSaleMode(product) !== "stock") return false;
        return (product.prices[currency] ?? 0) > 0;
      })
      .map((product) => {
        const sameSubcategory = Boolean(
          product.subcategoryId && subcategories.has(product.subcategoryId)
        );
        const sameCategory = Boolean(product.categoryId && categories.has(product.categoryId));
        const tier = sameSubcategory ? 0 : sameCategory ? 1 : popularRank.has(product.id) ? 2 : 3;
        return {
          product,
          tier,
          popular: popularRank.get(product.id) ?? Number.POSITIVE_INFINITY,
        };
      })
      .sort(
        (a, b) =>
          a.tier - b.tier ||
          a.popular - b.popular ||
          getProductName(a.product).localeCompare(getProductName(b.product))
      );

    return ranked.slice(0, UPSELL_LIMIT).map((entry) => entry.product);
  }, [
    catalogReady,
    countryCode,
    currency,
    getLineItems,
    getProductById,
    getProductName,
    lineKey,
    popularProductIds,
  ]);

  const count = products.length;
  const maxIndex = useMemo(() => {
    if (count <= 0) return 0;
    const fullyVisible = Math.max(1, Math.floor(perView));
    return Math.max(0, count - fullyVisible);
  }, [count, perView]);
  const step = cardWidth + GAP;
  const maxScroll = maxIndex * step;

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const per = cardsPerView(window.innerWidth);
    setPerView(per);
    const width = (viewport.clientWidth - SHADOW_BLEED * 2 - GAP * Math.floor(per)) / per;
    setCardWidth(Math.max(180, width));
  }, []);

  useEffect(() => {
    measure();
    const id = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
    };
  }, [measure, count]);

  const carousel = useHorizontalCarousel({
    viewportRef,
    maxScroll,
    step,
    maxIndex,
    snapOnDragEnd: false,
  });

  if (!catalogReady || !countryCode || !currency || products.length === 0) return null;

  return (
    <section className="mt-8" aria-roledescription="carousel">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-oboya-blue-dark">{t("upsellTitle")}</h2>
          <p className="text-sm text-oboya-blue-dark/60">{t("upsellHint")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/shop"
            className="shrink-0 text-sm font-medium text-oboya-blue-light hover:text-oboya-blue"
          >
            {t("seeAll")}
          </Link>
        </div>
      </div>
      <div
        ref={viewportRef}
        className={cn("-mx-4 -my-6 overflow-hidden px-4 py-6", carousel.viewportClassName)}
      >
        <motion.div
          className={cn("flex items-stretch select-none", carousel.trackClassName)}
          style={{ gap: GAP, width: "max-content", ...carousel.trackStyle }}
          animate={{ x: carousel.motionX }}
          transition={carousel.transition}
          {...carousel.trackHandlers}
        >
          {products.map((product) => {
            const featuredId = getFeaturedColorVariantId(product);
            const featuredVariant =
              featuredId === DEFAULT_COLOR_VARIANT_ID
                ? null
                : getActiveVariant(product, featuredId);
            const price = resolveVariantPrice(product, featuredVariant, currency);
            const moq = getProductMoq(product, featuredVariant?.id ?? null);
            const sku = resolveVariantSku(product, featuredVariant);
            const image = featuredVariant
              ? resolveVariantImage(product, featuredVariant)
              : product.images[0] || FALLBACK_IMAGE;
            const cartVariantId = toCartVariantId(featuredVariant?.id);
            const detailHref = `/shop/products/${product.sku || product.id}${
              cartVariantId ? `?variant=${encodeURIComponent(cartVariantId)}` : ""
            }`;
            return (
              <article
                key={product.id}
                className="flex shrink-0 flex-col self-stretch rounded-xl border border-border/60 bg-white p-3 shadow-[0_1px_3px_rgb(1_32_63/4%),0_6px_16px_rgb(1_32_63/6%)]"
                style={{ width: cardWidth > 0 ? cardWidth : "min(78%, 18rem)" }}
              >
                <Link
                  href={detailHref}
                  draggable={false}
                  className="relative mb-2 block aspect-[5/4]"
                >
                  <Image
                    src={image}
                    alt={getProductName(product)}
                    fill
                    unoptimized
                    loading="eager"
                    draggable={false}
                    className="object-contain p-2"
                    sizes="280px"
                  />
                </Link>
                <h3 className="line-clamp-2 h-[2.75em] text-sm font-semibold leading-snug text-oboya-blue-dark">
                  {getProductName(product)}
                </h3>
                <p className="text-[11px] text-oboya-blue-dark/60">{sku}</p>
                <p className="mt-1 text-sm font-semibold text-oboya-green">
                  {formatShopPrice(price, currency)}
                </p>
                <p className="mb-2 text-[10px] text-oboya-blue-dark/50">{t("moq", { count: moq })}</p>
                <button
                  type="button"
                  onClick={() => openAddToQuoteDialog(product.id, cartVariantId)}
                  className="mt-auto inline-flex h-8 items-center justify-center rounded-full bg-oboya-blue px-3 text-xs font-medium text-white hover:bg-oboya-blue/90"
                >
                  {tShop("addToQuote")}
                </button>
                <Link
                  href={detailHref}
                  className="mt-1.5 text-center text-[11px] text-oboya-blue-light hover:underline"
                >
                  {tShop("moreInformation")}
                </Link>
              </article>
            );
          })}
        </motion.div>
      </div>
      {maxIndex > 0 ? (
        <div className="mt-4 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => carousel.go(-1)}
            aria-label={t("upsellPrev")}
            className="flex size-10 items-center justify-center rounded-full border border-oboya-blue-dark/40 text-oboya-blue-dark transition-colors hover:border-oboya-blue-dark hover:bg-oboya-blue-dark/5"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => carousel.go(1)}
            aria-label={t("upsellNext")}
            className="flex size-10 items-center justify-center rounded-full border border-oboya-blue-dark/40 text-oboya-blue-dark transition-colors hover:border-oboya-blue-dark hover:bg-oboya-blue-dark/5"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
