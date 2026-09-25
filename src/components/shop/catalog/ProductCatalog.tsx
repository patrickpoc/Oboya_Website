"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { ProductCard } from "@/components/shop/catalog/ProductCard";
import { FilterChips } from "@/components/shop/catalog/FilterChips";
import {
  EmptyResults,
  LoadingSkeleton,
  SelectCountryPrompt,
} from "@/components/shop/states/ShopStateViews";
import { countActiveSkus } from "@/lib/shop/color-variants";

export function ProductCatalog() {
  const t = useTranslations("shop");
  const {
    countryCode,
    currency,
    viewMode,
    displayedProducts,
    filteredProducts,
    hasMoreProducts,
    loadMoreProducts,
    status,
    openAddToQuoteDialog,
    shopConfig,
  } = useShop();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const activeSkuCount = countActiveSkus(filteredProducts);
  const rfqEnabled = shopConfig.rfq.enabled;

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMoreProducts) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreProducts();
        }
      },
      { rootMargin: "320px 0px", threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreProducts, loadMoreProducts, displayedProducts.length]);

  if (!countryCode || !currency) {
    return <SelectCountryPrompt />;
  }

  if (status === "loading") {
    return <LoadingSkeleton viewMode={viewMode} />;
  }

  if (filteredProducts.length === 0) {
    return <EmptyResults />;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("resultsCount", { count: activeSkuCount })}
        </p>
      </div>
      <FilterChips />

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-4 xl:gap-5">
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              viewMode="grid"
              onAddToQuote={
                rfqEnabled
                  ? (variantId) => openAddToQuoteDialog(product.id, variantId)
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              viewMode="list"
              onAddToQuote={
                rfqEnabled
                  ? (variantId) => openAddToQuoteDialog(product.id, variantId)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {hasMoreProducts ? (
        <div
          ref={loadMoreRef}
          className="mt-8 flex items-center justify-center gap-2 py-2"
          aria-busy="true"
          aria-live="polite"
        >
          <span
            className="size-5 animate-spin rounded-full border-2 border-oboya-green/25 border-t-oboya-green"
            aria-hidden
          />
          <span className="text-sm text-muted-foreground">{t("loadMore")}</span>
        </div>
      ) : null}
    </div>
  );
}
