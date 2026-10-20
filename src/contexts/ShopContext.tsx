"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { getShopCatalog } from "@/lib/shop/catalog";
import { countActiveFilters, filterProducts, sortProducts } from "@/lib/shop/filters";
import {
  getActiveVariant,
  getVariantDisplayName,
  hasColorVariants,
  resolveVariantImage,
  resolveVariantPrice,
  resolveVariantSku,
} from "@/lib/shop/color-variants";
import { getEffectiveSaleMode, isPricedLine, isUnavailableLine } from "@/lib/shop/sale-mode";
import { summarizeQuoteLines } from "@/lib/shop/quote-pricing";
import type { ShopState } from "@/lib/shop/types";
import {
  defaultState,
  type ShopContextValue,
} from "@/contexts/shop/model";
import {
  useCatalogLoader,
  useMarketDefaults,
} from "@/contexts/shop/useCatalogLoader";
import {
  useListingHydration,
  useListingSync,
} from "@/contexts/shop/useListingUrl";
import { useShopCommands } from "@/contexts/shop/useShopCommands";
import { useRfq } from "@/contexts/shop/useRfq";

const ShopContext = createContext<ShopContextValue | null>(null);

export type { ShopContextValue } from "@/contexts/shop/model";

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const [state, setState] = useState<ShopState>(defaultState);
  const [addToQuoteProductId, setAddToQuoteProductId] = useState<string | null>(
    null
  );
  const [addToQuoteVariantId, setAddToQuoteVariantId] = useState<string | null>(
    null
  );
  const [isReady, setIsReady] = useState(false);
  const isShopListingRoute =
    pathname === "/shop" || pathname.endsWith("/shop");
  const isCheckoutRoute =
    pathname === "/checkout" || pathname.endsWith("/checkout");
  /** Catalog + cart overlays: listing, PDP, cart, and the quotation page. */
  const isShopAreaRoute =
    isShopListingRoute ||
    isCheckoutRoute ||
    /(?:^|\/)shop\//.test(pathname);

  const {
    shopProducts,
    setShopProducts,
    catalogReady,
    catalogTick,
    shopConfig,
    shopConfigRef,
    pageSize,
  } = useCatalogLoader({
    setState,
    setIsReady,
    isShopAreaRoute,
  });

  const listingRefs = useListingHydration({
    setState,
    isReady,
    isShopListingRoute,
    router,
    searchParams,
    catalogReady,
    shopConfigRef,
  });

  useMarketDefaults({
    setState,
    isReady,
    catalogReady,
    shopConfig,
  });

  useListingSync({
    state,
    setState,
    isReady,
    isShopListingRoute,
    catalogReady,
    catalogTick,
    ...listingRefs,
  });

  const commands = useShopCommands({
    setState,
    shopConfigRef,
    shopProducts,
    setShopProducts,
    setAddToQuoteProductId,
    setAddToQuoteVariantId,
  });

  const catalog = useMemo(() => {
    void catalogTick;
    return getShopCatalog();
  }, [catalogTick]);

  const baseProducts = useMemo(
    () => {
      if (!state.countryCode) return shopProducts;
      return shopProducts.filter((product) => {
        const enabledMap = product.enabledCountries ?? product.availability;
        return Boolean(enabledMap[state.countryCode!]);
      });
    },
    [shopProducts, state.countryCode]
  );

  const filteredProducts = useMemo(() => {
    const filtered = filterProducts(baseProducts, {
      countryCode: state.countryCode,
      currency: state.currency,
      search: state.search,
      filters: state.filters,
    });
    return sortProducts(filtered, state.sort, state.currency);
  }, [
    baseProducts,
    state.countryCode,
    state.currency,
    state.filters,
    state.search,
    state.sort,
  ]);

  const displayedProducts = useMemo(
    () => filteredProducts.slice(0, state.visibleCount),
    [filteredProducts, state.visibleCount]
  );

  const getLineItems = useCallback(() => {
    if (!state.currency) return [];
    return state.items
      .map((item) => {
        const product = commands.getProductByIdFromState(item.productId);
        if (!product) return null;
        const resolvedVariant =
          item.variantId || hasColorVariants(product)
            ? getActiveVariant(product, item.variantId)
            : null;
        // Only attach a color label when the product has color options.
        const colorLabel =
          resolvedVariant && hasColorVariants(product)
            ? getVariantDisplayName(resolvedVariant, locale)
            : null;
        const saleMode = getEffectiveSaleMode(product);
        const priced = isPricedLine(
          product,
          item.variantId ? resolvedVariant : null,
          state.currency!
        );
        const unavailable = isUnavailableLine(
          product,
          item.variantId ? resolvedVariant : null,
          state.currency!
        );
        const unitPrice = priced
          ? resolveVariantPrice(
              product,
              item.variantId ? resolvedVariant : null,
              state.currency!
            )
          : null;
        return {
          productId: item.productId,
          variantId: item.variantId ?? null,
          variantName: colorLabel,
          quantity: item.quantity,
          saleMode,
          unavailable,
          unitPrice,
          lineTotal: unitPrice === null ? null : unitPrice * item.quantity,
          sku: resolveVariantSku(product, resolvedVariant),
          image: resolveVariantImage(
            product,
            item.variantId || hasColorVariants(product)
              ? resolvedVariant
              : null
          ),
          categoryId: product.categoryId,
          brandId: product.brandId,
          stockStatus: product.stockStatus,
        };
      })
      .filter(Boolean) as ShopContextValue["getLineItems"] extends () => infer R
      ? R
      : never;
  }, [commands, locale, state.currency, state.items]);

  const {
    pricedTotal: estimatedTotal,
    pendingCount,
    pricing,
  } = useMemo(() => summarizeQuoteLines(getLineItems().filter((line) => !line.unavailable)),
    [getLineItems]);

  const itemCount = useMemo(() => getLineItems().length, [getLineItems]);

  const activeFilterCount = useMemo(
    () => countActiveFilters(state.filters),
    [state.filters]
  );

  const { resetRfqStatus, submitRfq } = useRfq({
    setState,
    shopConfigRef,
    state,
    getLineItems,
    estimatedTotal,
  });

  const value = useMemo<ShopContextValue>(
    () => ({
      ...state,
      isReady,
      catalogReady,
      shopConfig,
      pageSize,
      itemCount,
      activeFilterCount,
      filteredProducts,
      displayedProducts,
      hasMoreProducts: state.visibleCount < filteredProducts.length,
      estimatedTotal,
      pendingCount,
      pricing,
      countries: catalog.countries,
      // Hide taxonomy until live CMS filters arrive — never flash seed/demo.
      categories: catalogReady ? catalog.categories : [],
      brands: catalogReady ? catalog.brands : [],
      filterGroups: catalogReady ? catalog.filterGroups : [],
      filterOptions: catalogReady
        ? catalog.filterOptions
        : {
            applications: [],
            cultures: [],
            certifications: [],
            countriesOfOrigin: [],
          },
      getProductById: commands.getProductByIdFromState,
      ensureProductDetail: commands.ensureProductDetail,
      setCountry: commands.setCountry,
      setCurrency: commands.setCurrency,
      setSearch: commands.setSearch,
      setSort: commands.setSort,
      setViewMode: commands.setViewMode,
      setFilters: commands.setFilters,
      updateFilters: commands.updateFilters,
      clearFilters: commands.clearFilters,
      addItem: commands.addItem,
      updateQuantity: commands.updateQuantity,
      removeItem: commands.removeItem,
      clearCart: commands.clearCart,
      setCartOpen: commands.setCartOpen,
      setQuickViewProductId: commands.setQuickViewProductId,
      setQuoteModalOpen: commands.setQuoteModalOpen,
      setFilterDrawerOpen: commands.setFilterDrawerOpen,
      loadMoreProducts: commands.loadMoreProducts,
      resetVisibleCount: commands.resetVisibleCount,
      submitRfq,
      resetRfqStatus,
      addToQuoteProductId,
      addToQuoteVariantId,
      openAddToQuoteDialog: commands.openAddToQuoteDialog,
      closeAddToQuoteDialog: commands.closeAddToQuoteDialog,
      getLineItems,
    }),
    [
      state,
      isReady,
      catalogReady,
      shopConfig,
      pageSize,
      itemCount,
      activeFilterCount,
      filteredProducts,
      displayedProducts,
      estimatedTotal,
      pendingCount,
      pricing,
      catalog,
      commands,
      submitRfq,
      resetRfqStatus,
      addToQuoteProductId,
      addToQuoteVariantId,
      getLineItems,
    ]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within ShopProvider");
  }
  return context;
}

export function useShopOptional() {
  return useContext(ShopContext);
}
