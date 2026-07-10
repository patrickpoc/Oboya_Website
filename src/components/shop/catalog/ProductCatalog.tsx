"use client";

import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { buttonVariants } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/catalog/ProductCard";
import { FilterChips } from "@/components/shop/catalog/FilterChips";
import {
  EmptyResults,
  LoadingSkeleton,
  SelectCountryPrompt,
} from "@/components/shop/states/ShopStateViews";

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
    setQuickViewProductId,
  } = useShop();

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
          {t("resultsCount", { count: filteredProducts.length })}
        </p>
      </div>
      <FilterChips />

      {viewMode === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              viewMode="grid"
              onQuickView={() => setQuickViewProductId(product.id)}
              onAddToQuote={() => openAddToQuoteDialog(product.id)}
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
              onQuickView={() => setQuickViewProductId(product.id)}
              onAddToQuote={() => openAddToQuoteDialog(product.id)}
            />
          ))}
        </div>
      )}

      {hasMoreProducts && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={loadMoreProducts}
            className={buttonVariants({
              variant: "outline",
              size: "cta",
            })}
          >
            {t("loadMore")}
          </button>
        </div>
      )}
    </div>
  );
}
