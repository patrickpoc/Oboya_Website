export type CurrencyCode = string;
export type ShopLocalizedText = Partial<Record<"en" | "pt-BR" | "es" | "zh-CN", string>>;

export type StockStatus = "in_stock" | "limited" | "on_request";

export type SortOption =
  | "relevance"
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "availability";

export type ViewMode = "grid" | "list";

export interface ShopCountry {
  code: string;
  name: string;
  currencies: CurrencyCode[];
  defaultCurrency: CurrencyCode;
  primaryOfficeId?: string;
}

export interface ShopCategory {
  id: string;
  name: string;
  nameI18n?: ShopLocalizedText;
  /** Stable public key for URLs (e.g. `propagation`). */
  slug?: string;
  subcategories: {
    id: string;
    name: string;
    nameI18n?: ShopLocalizedText;
    slug?: string;
  }[];
}

export interface ShopBrand {
  id: string;
  name: string;
  nameI18n?: ShopLocalizedText;
  /** Stable public key for URLs (e.g. `oboya-qs-ecovaso`). */
  slug?: string;
  /** ISO country code from the Global Presence map (e.g. BR, US). */
  flag?: string;
}

export interface FilterOption {
  id: string;
  name: string;
  nameI18n?: ShopLocalizedText;
  /**
   * Stable public key for URLs / Solutions deep-links (e.g. `flowers`).
   * Prefer this over generated admin ids like `cultures-1788…`.
   */
  slug?: string;
}

/** Ordered filter group shown in admin + shop sidebar. */
export interface ShopFilterGroup {
  id: string;
  name: string;
  nameI18n?: ShopLocalizedText;
}

/**
 * Option lists keyed by filter group id.
 * Built-ins: applications, cultures, certifications, countriesOfOrigin.
 * Custom groups use arbitrary ids and map to `product.customFilters`.
 */
export interface ShopFilterOptions {
  applications: FilterOption[];
  cultures: FilterOption[];
  certifications: FilterOption[];
  countriesOfOrigin: FilterOption[];
  [groupId: string]: FilterOption[];
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductDocument {
  title: string;
  url: string;
  type: string;
}

export interface ProductColorVariant {
  id: string;
  /** English / fallback label. Prefer `nameI18n` for storefront. */
  name: string;
  /** Localized color names (en, pt-BR, es, zh-CN). */
  nameI18n?: ShopLocalizedText;
  /** Per-color SKU. Empty falls back to product base SKU. */
  sku: string;
  /** Minimum order quantity for this color. Falls back to product.moq when unset. */
  moq?: number;
  color: string;
  image: string;
  prices: Partial<Record<CurrencyCode, number>>;
  sortOrder: number;
}

export interface ShopProduct {
  id: string;
  sku: string;
  moq: number;
  brandId: string;
  categoryId: string;
  subcategoryId: string;
  images: string[];
  /**
   * Parallel to `images[]`. Each entry lists color ids that slot belongs to
   * (`__default__` + additional variant ids). Empty array = show for all colors.
   */
  imageColorIds: string[][];
  tags: string[];
  availability: Record<string, boolean>;
  prices: Partial<Record<CurrencyCode, number>>;
  enabledCountries?: Record<string, boolean>;
  application: string[];
  cultures: string[];
  certifications: string[];
  countryOfOrigin: string;
  /**
   * Values for custom filter groups (groupId → option ids).
   * Built-in groups use the dedicated fields above.
   */
  customFilters?: Record<string, string[]>;
  stockStatus: StockStatus;
  stockQuantity: number | null;
  unlimitedStock: boolean;
  specs: ProductSpec[];
  documents: ProductDocument[];
  relatedProductIds: string[];
  /**
   * Hex for the product’s standard / base color swatch (shown first when
   * additional `colorVariants` exist).
   */
  defaultColor: string;
  /** Localized labels for the base/default color (e.g. Black / Preto). */
  defaultColorName: ShopLocalizedText;
  /** Additional color options after the default. Empty = no color selection UI. */
  colorVariants: ProductColorVariant[];
}

export interface ShopCatalog {
  countries: ShopCountry[];
  categories: ShopCategory[];
  brands: ShopBrand[];
  filterGroups: ShopFilterGroup[];
  filterOptions: ShopFilterOptions;
  products: ShopProduct[];
}

export interface CartItem {
  productId: string;
  /** Selected color variant id, or null/undefined for base product. */
  variantId?: string | null;
  quantity: number;
}

export interface ShopFilters {
  categoryId: string | null;
  subcategoryIds: string[];
  brandIds: string[];
  applications: string[];
  cultures: string[];
  certifications: string[];
  countriesOfOrigin: string[];
  /** Selected option ids for custom filter groups. */
  customFilters: Record<string, string[]>;
  availabilityOnly: boolean;
  priceMin: number | null;
  priceMax: number | null;
}

export const EMPTY_SHOP_FILTERS: ShopFilters = {
  categoryId: null,
  subcategoryIds: [],
  brandIds: [],
  applications: [],
  cultures: [],
  certifications: [],
  countriesOfOrigin: [],
  customFilters: {},
  availabilityOnly: false,
  priceMin: null,
  priceMax: null,
};

export type ShopStatus = "idle" | "loading" | "error" | "offline";
export type RfqStatus = "idle" | "submitting" | "success" | "error";

export interface ShopState {
  countryCode: string | null;
  currency: CurrencyCode | null;
  items: CartItem[];
  search: string;
  sort: SortOption;
  viewMode: ViewMode;
  filters: ShopFilters;
  isCartOpen: boolean;
  quickViewProductId: string | null;
  isQuoteModalOpen: boolean;
  isFilterDrawerOpen: boolean;
  status: ShopStatus;
  rfqStatus: RfqStatus;
  rfqReferenceId: string | null;
  visibleCount: number;
}

export interface RfqPayload {
  company: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  message: string;
  countryCode: string;
  currency: CurrencyCode;
  officeId: string | null;
  privacyAccepted: boolean;
  marketingOptIn?: boolean;
  items: {
    productId: string;
    variantId?: string | null;
    variantName?: string | null;
    quantity: number;
    unitPrice: number;
  }[];
  estimatedTotal: number;
}

export interface ResolvedOffice {
  locationId: string;
  officeId: string;
  country: string;
  flag: string;
  company: string;
  partner: string;
  operationType: string;
  city: string;
  facility: string;
  segments: string;
  phone: string;
  email: string;
  businessHours: string;
}
