"use client";

/* Dependency lists match the provider before this split. Setters and refs are stable. */
/* eslint-disable react-hooks/exhaustive-deps */

import { useCallback, useMemo, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { getCountryByCode, getShopCatalog, updateShopCatalog } from "@/lib/shop/catalog";
import type { ShopConfig } from "@/lib/cms/shop-config/types";
import {
  clampQuantity,
  getProductMaxQuantity,
  getProductMoq,
} from "@/lib/shop/quantity";
import {
  normalizeColorVariants,
  normalizeImageColorIds,
  normalizeLocalizedColorName,
} from "@/lib/shop/color-variants";
import type {
  CurrencyCode,
  ShopFilters,
  ShopProduct,
  ShopState,
  SortOption,
  ViewMode,
} from "@/lib/shop/types";
import { EMPTY_SHOP_FILTERS } from "@/lib/shop/types";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { remapProductId } from "@/lib/shop/product-id-remap";
import { sameCartLine } from "@/contexts/shop/model";

export function useShopCommands({
  setState,
  shopConfigRef,
  shopProducts,
  setShopProducts,
  setAddToQuoteProductId,
  setAddToQuoteVariantId,
}: {
  setState: Dispatch<SetStateAction<ShopState>>;
  shopConfigRef: MutableRefObject<ShopConfig>;
  shopProducts: ShopProduct[];
  setShopProducts: Dispatch<SetStateAction<ShopProduct[]>>;
  setAddToQuoteProductId: Dispatch<SetStateAction<string | null>>;
  setAddToQuoteVariantId: Dispatch<SetStateAction<string | null>>;
}) {
  const setCountry = useCallback((countryCode: string) => {
    const country = getCountryByCode(countryCode);
    const chunk = shopConfigRef.current.catalog.pageSize;
    setState((prev) => ({
      ...prev,
      countryCode,
      currency: country?.defaultCurrency ?? prev.currency,
      items: [],
      visibleCount: chunk,
      filters: EMPTY_SHOP_FILTERS,
      search: "",
    }));
  }, []);

  const getProductByIdFromState = useCallback(
    (productId: string) =>
      shopProducts.find(
        (product) =>
          product.id === productId ||
          product.sku === productId ||
          product.id === remapProductId(productId)
      ),
    [shopProducts]
  );

  const ensureProductDetail = useCallback(
    async (productId: string) => {
      const existing = getProductByIdFromState(productId) as
        | (ShopProduct & { description?: Record<string, string> })
        | undefined;
      const hasDescription = Boolean(
        existing?.description &&
          Object.values(existing.description).some(
            (value) => typeof value === "string" && value.trim().length > 0
          )
      );
      if (existing && hasDescription) return existing;

      try {
        const response = await fetch(
          `/api/shop/products/${encodeURIComponent(productId)}`
        );
        if (!response.ok) return existing;
        const product = (await response.json()) as CmsProduct;
        if (product.status !== "published" || product.deletedAt) {
          return existing;
        }
        const normalized: ShopProduct = {
          ...product,
          defaultColor: product.defaultColor ?? "",
          defaultColorName: normalizeLocalizedColorName(product.defaultColorName),
          imageColorIds: normalizeImageColorIds(
            product.imageColorIds,
            (product.images ?? []).length
          ),
          colorVariants: normalizeColorVariants(product.colorVariants),
        };
        setShopProducts((prev) => {
          const index = prev.findIndex(
            (item) => item.id === normalized.id || item.sku === normalized.id
          );
          if (index < 0) return [...prev, normalized];
          const next = [...prev];
          next[index] = { ...next[index], ...normalized };
          return next;
        });
        updateShopCatalog({
          products: getShopCatalog().products.map((item) =>
            item.id === normalized.id || item.sku === normalized.id
              ? { ...item, ...normalized }
              : item
          ),
        });
        return normalized;
      } catch {
        return existing;
      }
    },
    [getProductByIdFromState]
  );

  const setCurrency = useCallback((currency: CurrencyCode) => {
    setState((prev) => ({ ...prev, currency }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setState((prev) => {
      if (prev.search === search) return prev;
      return {
        ...prev,
        search,
        visibleCount: shopConfigRef.current.catalog.pageSize,
      };
    });
  }, []);

  const setSort = useCallback((sort: SortOption) => {
    setState((prev) => ({ ...prev, sort, visibleCount: shopConfigRef.current.catalog.pageSize }));
  }, []);

  const setViewMode = useCallback((viewMode: ViewMode) => {
    setState((prev) => ({ ...prev, viewMode }));
  }, []);

  const setFilters = useCallback((filters: ShopFilters) => {
    setState((prev) => ({ ...prev, filters, visibleCount: shopConfigRef.current.catalog.pageSize }));
  }, []);

  const updateFilters = useCallback((patch: Partial<ShopFilters>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...patch },
      visibleCount: shopConfigRef.current.catalog.pageSize,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      filters: EMPTY_SHOP_FILTERS,
      visibleCount: shopConfigRef.current.catalog.pageSize,
    }));
  }, []);

  const addItem = useCallback(
    (productId: string, quantity = 1, variantId: string | null = null) => {
      if (!shopConfigRef.current.rfq.enabled) return;
      const product = getProductByIdFromState(productId);
      const normalizedVariantId = variantId || null;
      const moq = getProductMoq(product, normalizedVariantId);
      const maxQty = getProductMaxQuantity(product, normalizedVariantId);
      const normalizedQuantity = clampQuantity(quantity, moq, maxQty);

      setState((prev) => {
        const existing = prev.items.find((item) =>
          sameCartLine(item, productId, normalizedVariantId)
        );
        const nextQuantity = existing
          ? clampQuantity(existing.quantity + normalizedQuantity, moq, maxQty)
          : normalizedQuantity;
        const items = existing
          ? prev.items.map((item) =>
              sameCartLine(item, productId, normalizedVariantId)
                ? { ...item, quantity: nextQuantity }
                : item
            )
          : [
              ...prev.items,
              {
                productId,
                variantId: normalizedVariantId,
                quantity: nextQuantity,
              },
            ];
        // Close quick-view immediately; defer cart open so Base UI dialog
        // can release scroll lock before the mobile sheet locks again.
        return { ...prev, items, quickViewProductId: null };
      });

      window.setTimeout(() => {
        setState((prev) => ({ ...prev, isCartOpen: true }));
      }, 80);
    },
    [getProductByIdFromState]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number, variantId: string | null = null) => {
      const product = getProductByIdFromState(productId);
      const normalizedVariantId = variantId || null;
      const moq = getProductMoq(product, normalizedVariantId);
      const maxQty = getProductMaxQuantity(product, normalizedVariantId);

      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          sameCartLine(item, productId, normalizedVariantId)
            ? { ...item, quantity: clampQuantity(quantity, moq, maxQty) }
            : item
        ),
      }));
    },
    [getProductByIdFromState]
  );

  const removeItem = useCallback(
    (productId: string, variantId: string | null = null) => {
      const normalizedVariantId = variantId || null;
      setState((prev) => ({
        ...prev,
        items: prev.items.filter(
          (item) => !sameCartLine(item, productId, normalizedVariantId)
        ),
      }));
    },
    []
  );

  const clearCart = useCallback(() => {
    setState((prev) => ({ ...prev, items: [] }));
  }, []);

  const setCartOpen = useCallback((open: boolean) => {
    if (open && !shopConfigRef.current.rfq.enabled) return;
    setState((prev) => ({ ...prev, isCartOpen: open }));
  }, []);

  const setQuickViewProductId = useCallback((productId: string | null) => {
    setState((prev) => ({ ...prev, quickViewProductId: productId }));
  }, []);

  const setQuoteModalOpen = useCallback((open: boolean) => {
    if (open && !shopConfigRef.current.rfq.enabled) return;
    setState((prev) => ({
      ...prev,
      isQuoteModalOpen: open,
      // Reset sticky success/error when closing or starting a new quote request.
      ...(open || prev.rfqStatus === "success" || prev.rfqStatus === "error"
        ? open && prev.rfqStatus === "success"
          ? { rfqStatus: "idle" as const, rfqReferenceId: null }
          : !open
            ? { rfqStatus: "idle" as const, rfqReferenceId: null }
            : {}
        : {}),
    }));
  }, []);

  const setFilterDrawerOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, isFilterDrawerOpen: open }));
  }, []);

  const openAddToQuoteDialog = useCallback(
    (productId: string, variantId: string | null = null) => {
      if (!shopConfigRef.current.rfq.enabled) return;
      setAddToQuoteProductId(productId);
      setAddToQuoteVariantId(variantId);
    },
    []
  );

  const closeAddToQuoteDialog = useCallback(() => {
    setAddToQuoteProductId(null);
    setAddToQuoteVariantId(null);
  }, []);

  const loadMoreProducts = useCallback(() => {
    setState((prev) => ({
      ...prev,
      visibleCount: prev.visibleCount + shopConfigRef.current.catalog.pageSize,
    }));
  }, []);

  const resetVisibleCount = useCallback(() => {
    setState((prev) => ({ ...prev, visibleCount: shopConfigRef.current.catalog.pageSize }));
  }, []);

  return useMemo(
    () => ({
      setCountry,
      getProductByIdFromState,
      ensureProductDetail,
      setCurrency,
      setSearch,
      setSort,
      setViewMode,
      setFilters,
      updateFilters,
      clearFilters,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      setCartOpen,
      setQuickViewProductId,
      setQuoteModalOpen,
      setFilterDrawerOpen,
      openAddToQuoteDialog,
      closeAddToQuoteDialog,
      loadMoreProducts,
      resetVisibleCount,
    }),
    [
      setCountry,
      getProductByIdFromState,
      ensureProductDetail,
      setCurrency,
      setSearch,
      setSort,
      setViewMode,
      setFilters,
      updateFilters,
      clearFilters,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      setCartOpen,
      setQuickViewProductId,
      setQuoteModalOpen,
      setFilterDrawerOpen,
      openAddToQuoteDialog,
      closeAddToQuoteDialog,
      loadMoreProducts,
      resetVisibleCount,
    ]
  );
}
