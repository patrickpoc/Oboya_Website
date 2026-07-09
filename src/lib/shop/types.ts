export type CurrencyCode = "USD" | "BRL" | "EUR";

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
  subcategories: { id: string; name: string }[];
}

export interface ShopBrand {
  id: string;
  name: string;
}

export interface FilterOption {
  id: string;
  name: string;
}

export interface ShopFilterOptions {
  applications: FilterOption[];
  cultures: FilterOption[];
  certifications: FilterOption[];
  countriesOfOrigin: FilterOption[];
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

export interface ShopProduct {
  id: string;
  sku: string;
  moq: number;
  brandId: string;
  categoryId: string;
  subcategoryId: string;
  images: string[];
  tags: string[];
  availability: Record<string, boolean>;
  prices: Partial<Record<CurrencyCode, number>>;
  application: string[];
  cultures: string[];
  certifications: string[];
  countryOfOrigin: string;
  stockStatus: StockStatus;
  specs: ProductSpec[];
  documents: ProductDocument[];
  relatedProductIds: string[];
}

export interface ShopCatalog {
  countries: ShopCountry[];
  categories: ShopCategory[];
  brands: ShopBrand[];
  filterOptions: ShopFilterOptions;
  products: ShopProduct[];
}

export interface CartItem {
  productId: string;
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
  items: { productId: string; quantity: number; unitPrice: number }[];
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
