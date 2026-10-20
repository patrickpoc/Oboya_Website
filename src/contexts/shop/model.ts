import {
  PRODUCTS_PAGE_SIZE,
  getShopCatalog,
} from "@/lib/shop/catalog";
import type { ShopConfig } from "@/lib/cms/shop-config/types";
import { type ShopFilterTaxonomy } from "@/lib/shop/filter-groups";
import { clampQuantity } from "@/lib/shop/quantity";
import type {
  CartItem,
  CurrencyCode,
  RfqPayload,
  SaleMode,
  ShopFilters,
  ShopProduct,
  ShopState,
  SortOption,
  ViewMode,
} from "@/lib/shop/types";
import { EMPTY_SHOP_FILTERS } from "@/lib/shop/types";
import type { QuotePricing } from "@/lib/shop/quote-pricing";
import { remapCartLine } from "@/lib/shop/product-id-remap";

export const STORAGE_KEY = "oboya-shop-quote";

export interface PersistedState {
  countryCode: string | null;
  currency: CurrencyCode | null;
  items: CartItem[];
}

export interface ShopContextValue extends ShopState {
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
  /** Sum of priced lines only (quote lines are excluded). */
  estimatedTotal: number;
  pendingCount: number;
  pricing: QuotePricing;
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
    saleMode: SaleMode;
    /** Stock product without a price in the current currency (cannot be quoted). */
    unavailable: boolean;
    unitPrice: number | null;
    lineTotal: number | null;
    sku: string;
    image: string;
    categoryId: string;
    brandId: string;
    stockStatus: string;
  }>;
}

export function sameCartLine(
  item: CartItem,
  productId: string,
  variantId?: string | null
) {
  return (
    item.productId === productId &&
    (item.variantId ?? null) === (variantId ?? null)
  );
}

export function currentLocationQuery() {
  return window.location.search.startsWith("?")
    ? window.location.search.slice(1)
    : window.location.search;
}

/** Keep the listing query in the address bar without a Next/next-intl navigation. */
export function replaceListingQuery(query: string) {
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === nextUrl) return;
  window.history.replaceState(window.history.state, "", nextUrl);
}

export function catalogTaxonomy(): ShopFilterTaxonomy {
  const catalog = getShopCatalog();
  return {
    categories: catalog.categories,
    brands: catalog.brands,
    filterOptions: catalog.filterOptions,
  };
}

export function sanitizeCartItems(items: unknown): CartItem[] {
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

export function loadPersisted(): PersistedState {
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

export const defaultState: ShopState = {
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
