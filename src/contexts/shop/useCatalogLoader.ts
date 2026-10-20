"use client";

/* Dependency lists match the provider before this split. Setters and refs are stable. */
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  getShopCatalog,
  updateShopCatalog,
} from "@/lib/shop/catalog";
import {
  DEFAULT_SHOP_CONFIG,
  normalizeShopConfig,
} from "@/lib/cms/shop-config/defaults";
import type { ShopConfig } from "@/lib/cms/shop-config/types";
import {
  normalizeBrands,
  normalizeCategories,
  normalizeFilterGroups,
  normalizeFilterOptions,
  resolveShopFilters,
} from "@/lib/shop/filter-groups";
import { getCountryByCode } from "@/lib/shop/catalog";
import {
  normalizeColorVariants,
  normalizeImageColorIds,
  normalizeLocalizedColorName,
} from "@/lib/shop/color-variants";
import type { ShopProduct, ShopState } from "@/lib/shop/types";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { remapCartLine } from "@/lib/shop/product-id-remap";
import { PRODUCTS_PAGE_SIZE } from "@/lib/shop/catalog";
import {
  catalogTaxonomy,
  defaultState,
  loadPersisted,
} from "@/contexts/shop/model";

export function useCatalogLoader({
  setState,
  setIsReady,
  isShopAreaRoute,
}: {
  setState: Dispatch<SetStateAction<ShopState>>;
  setIsReady: Dispatch<SetStateAction<boolean>>;
  isShopAreaRoute: boolean;
}) {
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogTick, setCatalogTick] = useState(0);
  const [shopConfig, setShopConfig] = useState<ShopConfig>(DEFAULT_SHOP_CONFIG);
  const shopConfigRef = useRef(shopConfig);
  useLayoutEffect(() => {
    shopConfigRef.current = shopConfig;
  });
  const pageSize = shopConfig.catalog.pageSize || PRODUCTS_PAGE_SIZE;

  // Persist cart/country from localStorage once
  useEffect(() => {
    const persisted = loadPersisted();
    queueMicrotask(() => {
      setState((prev) => ({
        ...prev,
        countryCode: persisted.countryCode ?? prev.countryCode,
        currency: persisted.currency ?? prev.currency,
        items: persisted.items.length > 0 ? persisted.items : prev.items,
      }));
    });
    queueMicrotask(() => {
      setIsReady(true);
    });
  }, []);

  // Fetch catalog on shop listing + PDP so color variants are live off-listing.
  useEffect(() => {
    if (!isShopAreaRoute) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mark the catalog as loading before fetching it
    setCatalogReady(false);
    setState((prev) =>
      prev.status === "offline" ? prev : { ...prev, status: "loading" }
    );

    void (async () => {
      try {
        // Edge-cached and tag-invalidated on CMS writes; a plain GET lets the
        // CDN serve it instead of re-running the function per visitor.
        const catalogRes = await fetch("/api/shop/catalog");
        if (!catalogRes.ok) throw new Error("Failed to load products");
        const catalog = (await catalogRes.json()) as {
          products?: CmsProduct[];
          filters?: {
            categories?: ReturnType<typeof getShopCatalog>["categories"];
            brands?: ReturnType<typeof getShopCatalog>["brands"];
            filterGroups?: ReturnType<typeof getShopCatalog>["filterGroups"];
            filterOptions?: ReturnType<typeof getShopCatalog>["filterOptions"];
          };
          currencies?: {
            countries?: ReturnType<typeof getShopCatalog>["countries"];
          };
          shopConfig?: unknown;
        };

        const filters = catalog.filters;
        if (filters) {
          updateShopCatalog({
            categories: filters.categories
              ? normalizeCategories(filters.categories)
              : undefined,
            brands: filters.brands ? normalizeBrands(filters.brands) : undefined,
            filterGroups: filters.filterGroups
              ? normalizeFilterGroups(
                  filters.filterGroups,
                  normalizeFilterOptions(filters.filterOptions, filters.filterGroups)
                )
              : undefined,
            filterOptions: filters.filterOptions
              ? normalizeFilterOptions(filters.filterOptions, filters.filterGroups)
              : undefined,
          });
        }
        if (catalog.currencies?.countries) {
          updateShopCatalog({ countries: catalog.currencies.countries });
        }

        let nextShopConfig = DEFAULT_SHOP_CONFIG;
        if (catalog.shopConfig) {
          try {
            nextShopConfig = normalizeShopConfig(catalog.shopConfig, {
              countries: getShopCatalog().countries,
            });
          } catch {
            nextShopConfig = DEFAULT_SHOP_CONFIG;
          }
        }
        if (!cancelled) {
          setShopConfig(nextShopConfig);
          setState((prev) => ({
            ...prev,
            visibleCount: nextShopConfig.catalog.pageSize,
            // Apply catalog defaults only before URL hydration / when still at built-in defaults.
            sort:
              prev.sort === defaultState.sort
                ? nextShopConfig.catalog.defaultSort
                : prev.sort,
            viewMode:
              prev.viewMode === defaultState.viewMode
                ? nextShopConfig.catalog.defaultViewMode
                : prev.viewMode,
          }));
        }

        const products = catalog.products ?? [];
        const published = products
          .filter(
            (product) => product.status === "published" && !product.deletedAt
          )
          .map((product) => ({
            ...product,
            defaultColor: product.defaultColor ?? "",
            defaultColorName: normalizeLocalizedColorName(
              product.defaultColorName
            ),
            imageColorIds: normalizeImageColorIds(
              product.imageColorIds,
              (product.images ?? []).length
            ),
            colorVariants: normalizeColorVariants(product.colorVariants),
          }));
        if (cancelled) return;

        if (published.length > 0) {
          setShopProducts(published);
          updateShopCatalog({ products: published });
          const validIds = new Set(published.map((product) => product.id));
          // Also accept remapped legacy cart ids that land on current sku/id.
          setState((prev) => ({
            ...prev,
            status: prev.status === "offline" ? "offline" : "idle",
            items: prev.items
              .map((item) => remapCartLine(item))
              .filter((item) => validIds.has(item.productId)),
            filters: resolveShopFilters(prev.filters, catalogTaxonomy()),
          }));
        } else {
          // Keep any previously loaded CMS products; never revive seed demo data.
          setState((prev) =>
            prev.status === "offline" ? prev : { ...prev, status: "idle" }
          );
        }
        setCatalogTick((n) => n + 1);
        setCatalogReady(true);
      } catch {
        if (cancelled) return;
        // Last-resort seed fallback only when the API is unavailable.
        setShopProducts((prev) =>
          prev.length > 0 ? prev : getShopCatalog().products
        );
        setCatalogReady(true);
        setCatalogTick((n) => n + 1);
        setState((prev) =>
          prev.status === "offline"
            ? prev
            : {
                ...prev,
                status: "error",
                filters: resolveShopFilters(prev.filters, catalogTaxonomy()),
              }
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isShopAreaRoute]);

  return {
    shopProducts,
    setShopProducts,
    catalogReady,
    catalogTick,
    shopConfig,
    shopConfigRef,
    pageSize,
  };
}

export function useMarketDefaults({
  setState,
  isReady,
  catalogReady,
  shopConfig,
}: {
  setState: Dispatch<SetStateAction<ShopState>>;
  isReady: boolean;
  catalogReady: boolean;
  shopConfig: ShopConfig;
}) {
  const marketDefaultsApplied = useRef(false);

  // Apply market defaults once when visitor has no country from storage/URL.
  useEffect(() => {
    if (!catalogReady || !isReady || marketDefaultsApplied.current) return;
    const defaults = shopConfig.market;
    if (!defaults.defaultCountryCode) {
      marketDefaultsApplied.current = true;
      return;
    }

    let applied = false;
    setState((prev) => {
      if (prev.countryCode) {
        applied = true;
        return prev;
      }
      const country = getCountryByCode(defaults.defaultCountryCode!);
      if (!country) {
        applied = true;
        return prev;
      }
      const currency =
        defaults.defaultCurrencyCode &&
        country.currencies.includes(defaults.defaultCurrencyCode)
          ? defaults.defaultCurrencyCode
          : country.defaultCurrency;
      applied = true;
      return {
        ...prev,
        countryCode: country.code,
        currency,
      };
    });
    if (applied) marketDefaultsApplied.current = true;
  }, [catalogReady, isReady, shopConfig.market]);
}
