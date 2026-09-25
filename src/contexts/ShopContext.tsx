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
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  PRODUCTS_PAGE_SIZE,
  getCountryByCode,
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
  toPublicShopFilters,
  type ShopFilterTaxonomy,
} from "@/lib/shop/filter-groups";
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
import {
  getActiveVariant,
  getVariantDisplayName,
  hasColorVariants,
  normalizeColorVariants,
  normalizeImageColorIds,
  normalizeLocalizedColorName,
  resolveVariantImage,
  resolveVariantPrice,
  resolveVariantSku,
} from "@/lib/shop/color-variants";
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
import { remapCartLine, remapProductId } from "@/lib/shop/product-id-remap";

const STORAGE_KEY = "oboya-shop-quote";

interface PersistedState {
  countryCode: string | null;
  currency: CurrencyCode | null;
  items: CartItem[];
}

interface ShopContextValue extends ShopState {
  isReady: boolean;
  /** True after marketplace CMS products/filters have hydrated (or failed). */
  catalogReady: boolean;
  shopConfig: ShopConfig;
  pageSize: number;
  itemCount: number;
  activeFilterCount: number;
  filteredProducts: ShopProduct[];
  displayedProducts: ShopProduct[];
  hasMoreProducts: boolean;
  estimatedTotal: number;
  countries: ReturnType<typeof getShopCatalog>["countries"];
  categories: ReturnType<typeof getShopCatalog>["categories"];
  brands: ReturnType<typeof getShopCatalog>["brands"];
  filterGroups: ReturnType<typeof getShopCatalog>["filterGroups"];
  filterOptions: ReturnType<typeof getShopCatalog>["filterOptions"];
  getProductById: (productId: string) => ShopProduct | undefined;
  /** Load full product (incl. description HTML) when opening quick view / detail overlays. */
  ensureProductDetail: (productId: string) => Promise<ShopProduct | undefined>;
  setCountry: (countryCode: string) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setSearch: (search: string) => void;
  setSort: (sort: SortOption) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setFilters: (filters: ShopFilters) => void;
  updateFilters: (patch: Partial<ShopFilters>) => void;
  clearFilters: () => void;
  addItem: (productId: string, quantity?: number, variantId?: string | null) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string | null
  ) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
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
  addToQuoteVariantId: string | null;
  openAddToQuoteDialog: (productId: string, variantId?: string | null) => void;
  closeAddToQuoteDialog: () => void;
  getLineItems: () => Array<{
    productId: string;
    variantId: string | null;
    variantName: string | null;
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

function sameCartLine(
  item: CartItem,
  productId: string,
  variantId?: string | null
) {
  return (
    item.productId === productId &&
    (item.variantId ?? null) === (variantId ?? null)
  );
}

function currentLocationQuery() {
  return window.location.search.startsWith("?")
    ? window.location.search.slice(1)
    : window.location.search;
}

/** Keep the listing query in the address bar without a Next/next-intl navigation. */
function replaceListingQuery(query: string) {
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === nextUrl) return;
  window.history.replaceState(window.history.state, "", nextUrl);
}

function catalogTaxonomy(): ShopFilterTaxonomy {
  const catalog = getShopCatalog();
  return {
    categories: catalog.categories,
    brands: catalog.brands,
    filterOptions: catalog.filterOptions,
  };
}

function sanitizeCartItems(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Partial<CartItem>;
      if (typeof row.productId !== "string" || !row.productId.trim()) return null;
      const quantity = Number(row.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) return null;
      const variantId =
        typeof row.variantId === "string" && row.variantId.trim()
          ? row.variantId.trim()
          : null;
      const remapped = remapCartLine({
        productId: row.productId.trim(),
        variantId,
        quantity: clampQuantity(quantity, 1),
      });
      return remapped;
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
  const locale = useLocale();
  const [state, setState] = useState<ShopState>(defaultState);
  const [addToQuoteProductId, setAddToQuoteProductId] = useState<string | null>(
    null
  );
  const [addToQuoteVariantId, setAddToQuoteVariantId] = useState<string | null>(
    null
  );
  const [isReady, setIsReady] = useState(false);
  // Start empty — seed/demo JSON must not flash before the live CMS catalog loads.
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogTick, setCatalogTick] = useState(0);
  const [shopConfig, setShopConfig] = useState<ShopConfig>(DEFAULT_SHOP_CONFIG);
  const shopConfigRef = useRef(shopConfig);
  shopConfigRef.current = shopConfig;
  const marketDefaultsApplied = useRef(false);
  const pageSize = shopConfig.catalog.pageSize || PRODUCTS_PAGE_SIZE;
  const hydratedFromUrl = useRef(false);
  const skipUrlWrite = useRef(false);
  const lastSyncedQuery = useRef<string | null>(null);
  const wasOnShop = useRef(false);
  const softOpenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isShopListingRoute =
    pathname === "/shop" || pathname.endsWith("/shop");
  /** Catalog + cart overlays: listing, PDP, cart, checkout. */
  const isShopAreaRoute =
    isShopListingRoute || /(?:^|\/)shop\//.test(pathname);

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
    setCatalogReady(false);
    setState((prev) =>
      prev.status === "offline" ? prev : { ...prev, status: "loading" }
    );

    void (async () => {
      try {
        const catalogFetch: RequestInit = {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        };
        const [productsRes, filtersRes, currenciesRes, shopConfigRes] =
          await Promise.all([
            fetch("/api/cms/products?fields=list", catalogFetch),
            fetch("/api/cms/marketplace/filters", catalogFetch),
            fetch("/api/cms/marketplace/currencies", catalogFetch),
            fetch("/api/cms/marketplace/shop-config", catalogFetch),
          ]);
        if (!productsRes.ok) throw new Error("Failed to load products");

        if (filtersRes.ok) {
          const filters = (await filtersRes.json()) as {
            categories?: ReturnType<typeof getShopCatalog>["categories"];
            brands?: ReturnType<typeof getShopCatalog>["brands"];
            filterGroups?: ReturnType<typeof getShopCatalog>["filterGroups"];
            filterOptions?: ReturnType<typeof getShopCatalog>["filterOptions"];
          };
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
        if (currenciesRes.ok) {
          const currencies = (await currenciesRes.json()) as {
            countries?: ReturnType<typeof getShopCatalog>["countries"];
          };
          if (currencies.countries) {
            updateShopCatalog({ countries: currencies.countries });
          }
        }

        let nextShopConfig = DEFAULT_SHOP_CONFIG;
        if (shopConfigRes.ok) {
          try {
            const rawConfig = await shopConfigRes.json();
            nextShopConfig = normalizeShopConfig(rawConfig, {
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

        const products = (await productsRes.json()) as CmsProduct[];
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

  // Keep shop UI in sync with URL when entering / navigating within shop listing.
  // Prefer window.location over useSearchParams: on client navigations
  // (e.g. Solutions → Shop) the hook can briefly lag behind the address bar.
  // Hydrating from an empty hook query then write-back would wipe inbound filters.
  useEffect(() => {
    if (!isReady) return;

    if (!isShopListingRoute) {
      wasOnShop.current = false;
      hydratedFromUrl.current = false;
      lastSyncedQuery.current = null;
      skipUrlWrite.current = false;
      if (softOpenTimer.current) {
        clearTimeout(softOpenTimer.current);
        softOpenTimer.current = null;
      }
      return;
    }

    const applyQuery = (query: string, enteringShop: boolean) => {
      if (
        query === lastSyncedQuery.current &&
        !enteringShop &&
        hydratedFromUrl.current
      ) {
        return;
      }
      lastSyncedQuery.current = query;

      const urlState = parseShopUrlState(new URLSearchParams(query), {
        sort: shopConfigRef.current.catalog.defaultSort,
        view: shopConfigRef.current.catalog.defaultViewMode,
      });
      const pendingProduct = urlState.product;
      const softOpen = enteringShop && Boolean(pendingProduct);
      const rfqEnabled = shopConfigRef.current.rfq.enabled;
      const pageChunk = shopConfigRef.current.catalog.pageSize;

      if (softOpenTimer.current) {
        clearTimeout(softOpenTimer.current);
        softOpenTimer.current = null;
      }

      skipUrlWrite.current = true;
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
      hydratedFromUrl.current = true;

      if (softOpen && pendingProduct) {
        softOpenTimer.current = setTimeout(() => {
          softOpenTimer.current = null;
          skipUrlWrite.current = false;
          router.replace(`/shop/products/${remapProductId(pendingProduct)}`);
        }, 100);
      } else {
        queueMicrotask(() => {
          skipUrlWrite.current = false;
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
      hydratedFromUrl.current = false;
      if (softOpenTimer.current) {
        clearTimeout(softOpenTimer.current);
        softOpenTimer.current = null;
      }
    };
  }, [isReady, isShopListingRoute, router, searchParams, catalogReady]);

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
      !hydratedFromUrl.current ||
      skipUrlWrite.current
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
    if (next === lastSyncedQuery.current) return;
    lastSyncedQuery.current = next;
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
        const response = await fetch(`/api/cms/products/${productId}`, {
          cache: "no-store",
        });
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
        const product = getProductByIdFromState(item.productId);
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
        const unitPrice = resolveVariantPrice(
          product,
          item.variantId ? resolvedVariant : null,
          state.currency!
        );
        return {
          productId: item.productId,
          variantId: item.variantId ?? null,
          variantName: colorLabel,
          quantity: item.quantity,
          unitPrice,
          lineTotal: unitPrice * item.quantity,
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
  }, [getProductByIdFromState, locale, state.currency, state.items]);

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
      if (!shopConfigRef.current.rfq.enabled) {
        throw new Error("Quote requests are disabled");
      }
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
          variantId: item.variantId,
          variantName: item.variantName,
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
      catalogReady,
      shopConfig,
      pageSize,
      itemCount,
      activeFilterCount,
      filteredProducts,
      displayedProducts,
      hasMoreProducts: state.visibleCount < filteredProducts.length,
      estimatedTotal,
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
      getProductById: getProductByIdFromState,
      ensureProductDetail,
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
      addToQuoteVariantId,
      openAddToQuoteDialog,
      closeAddToQuoteDialog,
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
      catalog,
      getProductByIdFromState,
      ensureProductDetail,
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
      addToQuoteVariantId,
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
