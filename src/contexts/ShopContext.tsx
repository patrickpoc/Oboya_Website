"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  PRODUCTS_PAGE_SIZE,
  getCountryByCode,
  getShopCatalog,
} from "@/lib/shop/catalog";
import { countActiveFilters, filterProducts, sortProducts } from "@/lib/shop/filters";
import {
  buildShopSearchParams,
  parseShopUrlState,
} from "@/lib/shop/url-state";
import {
  clampQuantity,
  getProductMaxQuantity,
  getProductMoq,
} from "@/lib/shop/quantity";
import type {
  CartItem,
  CurrencyCode,
  RfqPayload,
  ShopFilters,
  ShopProduct,
  ShopState,
  SortOption,
  ViewMode,
} from "@/lib/shop/types";
import { EMPTY_SHOP_FILTERS } from "@/lib/shop/types";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

const STORAGE_KEY = "oboya-shop-quote";

interface PersistedState {
  countryCode: string | null;
  currency: CurrencyCode | null;
  items: CartItem[];
}

interface ShopContextValue extends ShopState {
  isReady: boolean;
  itemCount: number;
  activeFilterCount: number;
  filteredProducts: ShopProduct[];
  displayedProducts: ShopProduct[];
  hasMoreProducts: boolean;
  estimatedTotal: number;
  countries: ReturnType<typeof getShopCatalog>["countries"];
  categories: ReturnType<typeof getShopCatalog>["categories"];
  brands: ReturnType<typeof getShopCatalog>["brands"];
  filterOptions: ReturnType<typeof getShopCatalog>["filterOptions"];
  getProductById: (productId: string) => ShopProduct | undefined;
  setCountry: (countryCode: string) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setSearch: (search: string) => void;
  setSort: (sort: SortOption) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setFilters: (filters: ShopFilters) => void;
  updateFilters: (patch: Partial<ShopFilters>) => void;
  clearFilters: () => void;
  addItem: (productId: string, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;
  setQuickViewProductId: (productId: string | null) => void;
  setQuoteModalOpen: (open: boolean) => void;
  setFilterDrawerOpen: (open: boolean) => void;
  loadMoreProducts: () => void;
  resetVisibleCount: () => void;
  submitRfq: (payload: Omit<RfqPayload, "items" | "estimatedTotal" | "countryCode" | "currency" | "officeId">, officeId?: string | null) => Promise<string>;
  resetRfqStatus: () => void;
  addToQuoteProductId: string | null;
  openAddToQuoteDialog: (productId: string) => void;
  closeAddToQuoteDialog: () => void;
  getLineItems: () => Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    sku: string;
    image: string;
    categoryId: string;
    brandId: string;
    stockStatus: string;
  }>;
}

const ShopContext = createContext<ShopContextValue | null>(null);

function sanitizeCartItems(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Partial<CartItem>;
      if (typeof row.productId !== "string" || !row.productId.trim()) return null;
      const quantity = Number(row.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) return null;
      return {
        productId: row.productId.trim(),
        quantity: clampQuantity(quantity, 1),
      };
    })
    .filter(Boolean) as CartItem[];
}

function loadPersisted(): PersistedState {
  if (typeof window === "undefined") {
    return { countryCode: null, currency: null, items: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { countryCode: null, currency: null, items: [] };
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      countryCode: parsed.countryCode ?? null,
      currency: parsed.currency ?? null,
      items: sanitizeCartItems(parsed.items),
    };
  } catch {
    return { countryCode: null, currency: null, items: [] };
  }
}

const defaultState: ShopState = {
  countryCode: null,
  currency: null,
  items: [],
  search: "",
  sort: "relevance",
  viewMode: "grid",
  filters: EMPTY_SHOP_FILTERS,
  isCartOpen: false,
  quickViewProductId: null,
  isQuoteModalOpen: false,
  isFilterDrawerOpen: false,
  status: "idle",
  rfqStatus: "idle",
  rfqReferenceId: null,
  visibleCount: PRODUCTS_PAGE_SIZE,
};

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<ShopState>(defaultState);
  const [addToQuoteProductId, setAddToQuoteProductId] = useState<string | null>(
    null
  );
  const [isReady, setIsReady] = useState(false);
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>(() => getShopCatalog().products);
  const hydratedFromUrl = useRef(false);
  const skipUrlWrite = useRef(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedQuery = useRef<string | null>(null);
  const wasOnShop = useRef(false);
  const softOpenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isShopRoute = pathname === "/shop" || pathname.endsWith("/shop");

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

  // Fetch catalog only on shop routes to avoid site-wide product API load.
  useEffect(() => {
    if (!isShopRoute) return;

    let cancelled = false;
    setState((prev) =>
      prev.status === "offline" ? prev : { ...prev, status: "loading" }
    );

    void (async () => {
      try {
        const response = await fetch("/api/cms/products", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load products");
        const products = (await response.json()) as CmsProduct[];
        const published = products.filter(
          (product) => product.status === "published" && !product.deletedAt
        );
        if (cancelled) return;
        if (published.length > 0) {
          setShopProducts(published);
          const validIds = new Set(published.map((product) => product.id));
          setState((prev) => ({
            ...prev,
            status: prev.status === "offline" ? "offline" : "idle",
            items: prev.items.filter((item) => validIds.has(item.productId)),
          }));
        } else {
          setState((prev) =>
            prev.status === "offline" ? prev : { ...prev, status: "idle" }
          );
        }
      } catch {
        if (cancelled) return;
        // Keep static fallback catalog when API is unavailable.
        setState((prev) =>
          prev.status === "offline" ? prev : { ...prev, status: "error" }
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isShopRoute]);

  // Keep shop UI in sync with URL when entering / navigating within shop
  useEffect(() => {
    if (!isReady) return;

    if (!isShopRoute) {
      wasOnShop.current = false;
      if (softOpenTimer.current) {
        clearTimeout(softOpenTimer.current);
        softOpenTimer.current = null;
      }
      return;
    }

    const enteringShop = !wasOnShop.current;
    wasOnShop.current = true;

    const query = searchParams.toString();
    if (query === lastSyncedQuery.current && !enteringShop) return;
    lastSyncedQuery.current = query;

    const urlState = parseShopUrlState(searchParams);
    const pendingProduct = urlState.product;
    // On first entry: apply search first, open product detail after a beat
    const softOpen = enteringShop && Boolean(pendingProduct);

    if (softOpenTimer.current) {
      clearTimeout(softOpenTimer.current);
      softOpenTimer.current = null;
    }

    skipUrlWrite.current = true;
    setState((prev) => ({
      ...prev,
      countryCode: urlState.country ?? prev.countryCode,
      currency: urlState.currency ?? prev.currency,
      search: urlState.q,
      sort: urlState.sort,
      viewMode: urlState.view,
      filters: urlState.filters,
      quickViewProductId: softOpen ? null : pendingProduct,
      isCartOpen: urlState.cart,
      isQuoteModalOpen: urlState.quote,
      visibleCount: PRODUCTS_PAGE_SIZE,
    }));
    hydratedFromUrl.current = true;

    if (softOpen && pendingProduct) {
      // Keep URL intact while the catalog settles, then open the drawer
      softOpenTimer.current = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          quickViewProductId: pendingProduct,
        }));
        softOpenTimer.current = null;
        skipUrlWrite.current = false;
      }, 650);
    } else {
      queueMicrotask(() => {
        skipUrlWrite.current = false;
      });
    }

    return () => {
      if (softOpenTimer.current) {
        clearTimeout(softOpenTimer.current);
        softOpenTimer.current = null;
      }
    };
  }, [isReady, isShopRoute, searchParams]);

  useEffect(() => {
    if (!isReady) return;
    const payload: PersistedState = {
      countryCode: state.countryCode,
      currency: state.currency,
      items: state.items,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [state.countryCode, state.currency, state.items, isReady]);

  // Only write shop state back to the URL while on the shop route
  useEffect(() => {
    if (
      !isShopRoute ||
      !isReady ||
      !hydratedFromUrl.current ||
      skipUrlWrite.current
    ) {
      return;
    }

    const params = buildShopSearchParams({
      countryCode: state.countryCode,
      currency: state.currency,
      search: state.search,
      sort: state.sort,
      viewMode: state.viewMode,
      filters: state.filters,
      quickViewProductId: state.quickViewProductId,
      isCartOpen: state.isCartOpen,
      isQuoteModalOpen: state.isQuoteModalOpen,
    });

    const next = params.toString();
    const current = searchParams.toString();
    if (next === current) return;

    lastSyncedQuery.current = next;
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [
    isReady,
    isShopRoute,
    pathname,
    router,
    searchParams,
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

  const setCountry = useCallback((countryCode: string) => {
    const country = getCountryByCode(countryCode);
    setState((prev) => ({
      ...prev,
      countryCode,
      currency: country?.defaultCurrency ?? prev.currency,
      items: [],
      visibleCount: PRODUCTS_PAGE_SIZE,
      filters: EMPTY_SHOP_FILTERS,
      search: "",
    }));
  }, []);

  const getProductByIdFromState = useCallback(
    (productId: string) => shopProducts.find((product) => product.id === productId),
    [shopProducts]
  );

  const setCurrency = useCallback((currency: CurrencyCode) => {
    setState((prev) => ({ ...prev, currency }));
  }, []);

  const setSearch = useCallback((search: string) => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        search,
        visibleCount: PRODUCTS_PAGE_SIZE,
      }));
      searchDebounce.current = null;
    }, 300);
  }, []);

  const setSort = useCallback((sort: SortOption) => {
    setState((prev) => ({ ...prev, sort, visibleCount: PRODUCTS_PAGE_SIZE }));
  }, []);

  const setViewMode = useCallback((viewMode: ViewMode) => {
    setState((prev) => ({ ...prev, viewMode }));
  }, []);

  const setFilters = useCallback((filters: ShopFilters) => {
    setState((prev) => ({ ...prev, filters, visibleCount: PRODUCTS_PAGE_SIZE }));
  }, []);

  const updateFilters = useCallback((patch: Partial<ShopFilters>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...patch },
      visibleCount: PRODUCTS_PAGE_SIZE,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      filters: EMPTY_SHOP_FILTERS,
      visibleCount: PRODUCTS_PAGE_SIZE,
    }));
  }, []);

  const addItem = useCallback((productId: string, quantity = 1) => {
    const product = getProductByIdFromState(productId);
    const moq = getProductMoq(product);
    const maxQty = getProductMaxQuantity(product);
    const normalizedQuantity = clampQuantity(quantity, moq, maxQty);

    setState((prev) => {
      const existing = prev.items.find((item) => item.productId === productId);
      const nextQuantity = existing
        ? clampQuantity(existing.quantity + normalizedQuantity, moq, maxQty)
        : normalizedQuantity;
      const items = existing
        ? prev.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: nextQuantity }
              : item
          )
        : [...prev.items, { productId, quantity: nextQuantity }];
      return { ...prev, items, isCartOpen: true };
    });
  }, [getProductByIdFromState]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const product = getProductByIdFromState(productId);
    const moq = getProductMoq(product);
    const maxQty = getProductMaxQuantity(product);

    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productId === productId
          ? { ...item, quantity: clampQuantity(quantity, moq, maxQty) }
          : item
      ),
    }));
  }, [getProductByIdFromState]);

  const removeItem = useCallback((productId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.productId !== productId),
    }));
  }, []);

  const clearCart = useCallback(() => {
    setState((prev) => ({ ...prev, items: [] }));
  }, []);

  const setCartOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, isCartOpen: open }));
  }, []);

  const setQuickViewProductId = useCallback((productId: string | null) => {
    setState((prev) => ({ ...prev, quickViewProductId: productId }));
  }, []);

  const setQuoteModalOpen = useCallback((open: boolean) => {
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

  const openAddToQuoteDialog = useCallback((productId: string) => {
    setAddToQuoteProductId(productId);
  }, []);

  const closeAddToQuoteDialog = useCallback(() => {
    setAddToQuoteProductId(null);
  }, []);

  const loadMoreProducts = useCallback(() => {
    setState((prev) => ({
      ...prev,
      visibleCount: prev.visibleCount + PRODUCTS_PAGE_SIZE,
    }));
  }, []);

  const resetVisibleCount = useCallback(() => {
    setState((prev) => ({ ...prev, visibleCount: PRODUCTS_PAGE_SIZE }));
  }, []);

  const catalog = getShopCatalog();

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
        const product = getProductByIdFromState(item.productId);
        if (!product) return null;
        const unitPrice = product.prices[state.currency!] ?? 0;
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          lineTotal: unitPrice * item.quantity,
          sku: product.sku,
          image: product.images[0] ?? "",
          categoryId: product.categoryId,
          brandId: product.brandId,
          stockStatus: product.stockStatus,
        };
      })
      .filter(Boolean) as ShopContextValue["getLineItems"] extends () => infer R
      ? R
      : never;
  }, [getProductByIdFromState, state.currency, state.items]);

  const estimatedTotal = useMemo(
    () => getLineItems().reduce((sum, item) => sum + item.lineTotal, 0),
    [getLineItems]
  );

  const itemCount = useMemo(() => getLineItems().length, [getLineItems]);

  const activeFilterCount = useMemo(
    () => countActiveFilters(state.filters),
    [state.filters]
  );

  const resetRfqStatus = useCallback(() => {
    setState((prev) => ({ ...prev, rfqStatus: "idle", rfqReferenceId: null }));
  }, []);

  const submitRfq = useCallback(
    async (
      form: Omit<
        RfqPayload,
        "items" | "estimatedTotal" | "countryCode" | "currency" | "officeId"
      >,
      officeId: string | null = null
    ) => {
      if (!state.countryCode || !state.currency) {
        throw new Error("Country and currency required");
      }

      let shouldSubmit = true;
      setState((prev) => {
        if (prev.rfqStatus === "submitting") {
          shouldSubmit = false;
          return prev;
        }
        return { ...prev, rfqStatus: "submitting" };
      });
      if (!shouldSubmit) {
        throw new Error("Submission already in progress");
      }

      const lineItems = getLineItems();
      if (lineItems.length === 0) {
        setState((prev) => ({ ...prev, rfqStatus: "error" }));
        throw new Error("Quote list is empty");
      }

      const payload: RfqPayload = {
        ...form,
        countryCode: state.countryCode,
        currency: state.currency,
        officeId,
        items: lineItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        estimatedTotal,
      };

      try {
        const response = await fetch("/api/shop/rfq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = (await response.json()) as {
          referenceId?: string;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(result.error ?? "Failed to submit RFQ");
        }
        const referenceId = result.referenceId ?? `QT-${Date.now()}`;
        setState((prev) => ({
          ...prev,
          rfqStatus: "success",
          rfqReferenceId: referenceId,
          items: [],
          // Keep modal open so RfqSuccess is visible.
          isQuoteModalOpen: true,
        }));
        return referenceId;
      } catch {
        setState((prev) => ({ ...prev, rfqStatus: "error" }));
        throw new Error("Failed to submit RFQ");
      }
    },
    [estimatedTotal, getLineItems, state.countryCode, state.currency]
  );

  const value = useMemo<ShopContextValue>(
    () => ({
      ...state,
      isReady,
      itemCount,
      activeFilterCount,
      filteredProducts,
      displayedProducts,
      hasMoreProducts: state.visibleCount < filteredProducts.length,
      estimatedTotal,
      countries: catalog.countries,
      categories: catalog.categories,
      brands: catalog.brands,
      filterOptions: catalog.filterOptions,
      getProductById: getProductByIdFromState,
      setCountry,
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
      loadMoreProducts,
      resetVisibleCount,
      submitRfq,
      resetRfqStatus,
      addToQuoteProductId,
      openAddToQuoteDialog,
      closeAddToQuoteDialog,
      getLineItems,
    }),
    [
      state,
      isReady,
      itemCount,
      activeFilterCount,
      filteredProducts,
      displayedProducts,
      estimatedTotal,
      catalog,
      getProductByIdFromState,
      setCountry,
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
      loadMoreProducts,
      resetVisibleCount,
      submitRfq,
      resetRfqStatus,
      addToQuoteProductId,
      openAddToQuoteDialog,
      closeAddToQuoteDialog,
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
