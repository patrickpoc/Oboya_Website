"use client";

/* Dependency lists match the provider before this split. Setters and refs are stable. */
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { ShopConfig } from "@/lib/cms/shop-config/types";
import { resolveShopFilters, toPublicShopFilters } from "@/lib/shop/filter-groups";
import { buildShopSearchParams, parseShopUrlState } from "@/lib/shop/url-state";
import type { ShopState } from "@/lib/shop/types";
import { remapProductId } from "@/lib/shop/product-id-remap";
import {
  catalogTaxonomy,
  currentLocationQuery,
  replaceListingQuery,
  STORAGE_KEY,
  type PersistedState,
} from "@/contexts/shop/model";

export function useListingHydration({
  setState,
  isReady,
  isShopListingRoute,
  router,
  searchParams,
  catalogReady,
  shopConfigRef,
}: {
  setState: Dispatch<SetStateAction<ShopState>>;
  isReady: boolean;
  isShopListingRoute: boolean;
  router: { replace: (href: string) => void };
  searchParams: { toString: () => string };
  catalogReady: boolean;
  shopConfigRef: MutableRefObject<ShopConfig>;
}) {
  const hydratedFromUrlRef = useRef(false);
  const skipUrlWriteRef = useRef(false);
  const lastSyncedQueryRef = useRef<string | null>(null);
  const wasOnShop = useRef(false);
  const softOpenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSoftOpen = useRef<string | null>(null);

  // Keep shop UI in sync with URL when entering / navigating within shop listing.
  // Prefer window.location over useSearchParams: on client navigations
  // (e.g. Solutions → Shop) the hook can briefly lag behind the address bar.
  // Hydrating from an empty hook query then write-back would wipe inbound filters.
  useEffect(() => {
    if (!isReady) return;

    if (!isShopListingRoute) {
      wasOnShop.current = false;
      hydratedFromUrlRef.current = false;
      lastSyncedQueryRef.current = null;
      skipUrlWriteRef.current = false;
      pendingSoftOpen.current = null;
      if (softOpenTimer.current) {
        clearTimeout(softOpenTimer.current);
        softOpenTimer.current = null;
      }
      return;
    }

    const applyQuery = (query: string, enteringShop: boolean) => {
      if (
        query === lastSyncedQueryRef.current &&
        !enteringShop &&
        hydratedFromUrlRef.current
      ) {
        return;
      }
      lastSyncedQueryRef.current = query;

      const urlState = parseShopUrlState(new URLSearchParams(query), {
        sort: shopConfigRef.current.catalog.defaultSort,
        view: shopConfigRef.current.catalog.defaultViewMode,
      });
      const pendingProduct = urlState.product;
      const softOpen =
        Boolean(pendingProduct) &&
        (enteringShop || pendingSoftOpen.current === pendingProduct);
      const rfqEnabled = shopConfigRef.current.rfq.enabled;
      const pageChunk = shopConfigRef.current.catalog.pageSize;

      // Bookmarked ?quote=open used to open the RFQ modal. The quotation page is the only send step.
      if (rfqEnabled && urlState.quote) {
        router.replace("/checkout");
        return;
      }

      if (softOpenTimer.current) {
        clearTimeout(softOpenTimer.current);
        softOpenTimer.current = null;
      }

      skipUrlWriteRef.current = true;
      setState((prev) => {
        const rawFilters = urlState.filters;
        const filters = catalogReady
          ? resolveShopFilters(rawFilters, catalogTaxonomy())
          : rawFilters;
        return {
          ...prev,
          countryCode: urlState.country ?? prev.countryCode,
          currency: urlState.currency ?? prev.currency,
          search: urlState.q,
          sort: urlState.sort,
          viewMode: urlState.view,
          filters,
          quickViewProductId: null,
          isCartOpen: rfqEnabled ? urlState.cart : false,
          isQuoteModalOpen: rfqEnabled ? urlState.quote : false,
          visibleCount: pageChunk,
        };
      });
      hydratedFromUrlRef.current = true;

      if (softOpen && pendingProduct) {
        pendingSoftOpen.current = pendingProduct;
        softOpenTimer.current = setTimeout(() => {
          softOpenTimer.current = null;
          pendingSoftOpen.current = null;
          skipUrlWriteRef.current = false;
          router.replace(`/shop/products/${remapProductId(pendingProduct)}`);
        }, 100);
      } else {
        pendingSoftOpen.current = null;
        queueMicrotask(() => {
          skipUrlWriteRef.current = false;
        });
      }
    };

    const enteringShop = !wasOnShop.current;
    wasOnShop.current = true;
    applyQuery(currentLocationQuery(), enteringShop);

    const onPopState = () => {
      applyQuery(currentLocationQuery(), false);
    };
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
      // Strict Mode remount discards the prior setState — force re-hydrate.
      hydratedFromUrlRef.current = false;
      if (softOpenTimer.current) {
        clearTimeout(softOpenTimer.current);
        softOpenTimer.current = null;
      }
    };
  }, [isReady, isShopListingRoute, router, searchParams, catalogReady]);

  return {
    hydratedFromUrlRef,
    skipUrlWriteRef,
    lastSyncedQueryRef,
  };
}

export function useListingSync({
  state,
  setState,
  isReady,
  isShopListingRoute,
  catalogReady,
  catalogTick,
  hydratedFromUrlRef,
  skipUrlWriteRef,
  lastSyncedQueryRef,
}: {
  state: ShopState;
  setState: Dispatch<SetStateAction<ShopState>>;
  isReady: boolean;
  isShopListingRoute: boolean;
  catalogReady: boolean;
  catalogTick: number;
  hydratedFromUrlRef: MutableRefObject<boolean>;
  skipUrlWriteRef: MutableRefObject<boolean>;
  lastSyncedQueryRef: MutableRefObject<string | null>;
}) {
  useEffect(() => {
    if (!isReady) return;
    const payload: PersistedState = {
      countryCode: state.countryCode,
      currency: state.currency,
      items: state.items,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [state.countryCode, state.currency, state.items, isReady]);

  // Mirror shop listing state into the address bar on every change.
  // history.replaceState (not next-intl router.replace) so query strings
  // from inbound links (Solutions, etc.) stay writable.
  // Prefer stable slugs (`flowers`) over generated CMS ids in the URL.
  useEffect(() => {
    if (
      !isShopListingRoute ||
      !isReady ||
      !hydratedFromUrlRef.current ||
      skipUrlWriteRef.current
    ) {
      return;
    }

    const publicFilters = catalogReady
      ? toPublicShopFilters(state.filters, catalogTaxonomy())
      : state.filters;

    const params = buildShopSearchParams({
      countryCode: state.countryCode,
      currency: state.currency,
      search: state.search,
      sort: state.sort,
      viewMode: state.viewMode,
      filters: publicFilters,
      quickViewProductId: state.quickViewProductId,
      isCartOpen: state.isCartOpen,
      isQuoteModalOpen: state.isQuoteModalOpen,
    });

    const next = params.toString();
    if (next === lastSyncedQueryRef.current) return;
    lastSyncedQueryRef.current = next;
    replaceListingQuery(next);
  }, [
    isReady,
    isShopListingRoute,
    catalogReady,
    catalogTick,
    state.countryCode,
    state.currency,
    state.filters,
    state.isCartOpen,
    state.isQuoteModalOpen,
    state.quickViewProductId,
    state.search,
    state.sort,
    state.viewMode,
  ]);

  useEffect(() => {
    const handleOnline = () =>
      setState((prev) => ({ ...prev, status: "idle" }));
    const handleOffline = () =>
      setState((prev) => ({ ...prev, status: "offline" }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (!navigator.onLine) {
      queueMicrotask(() => {
        setState((prev) => ({ ...prev, status: "offline" }));
      });
    }
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
}
