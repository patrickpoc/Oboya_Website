import type {
  ShopLocalizedText,
  SortOption,
  ViewMode,
} from "@/lib/shop/types";

export const SHOP_CONFIG_PAGE_SIZES = [12, 24, 48] as const;
export type ShopConfigPageSize = (typeof SHOP_CONFIG_PAGE_SIZES)[number];

export const SHOP_CONFIG_RFQ_FIELD_KEYS = [
  "company",
  "contactName",
  "email",
  "phone",
  "country",
  "message",
  "marketingOptIn",
] as const;

export type ShopConfigRfqFieldKey = (typeof SHOP_CONFIG_RFQ_FIELD_KEYS)[number];

export type ShopConfigRfqField = {
  visible: boolean;
  required: boolean;
};

export type ShopConfig = {
  catalog: {
    defaultViewMode: ViewMode;
    defaultSort: SortOption;
    pageSize: ShopConfigPageSize;
  };
  rfq: {
    enabled: boolean;
    fields: Record<ShopConfigRfqFieldKey, ShopConfigRfqField>;
    introI18n: ShopLocalizedText;
    confirmationI18n: ShopLocalizedText;
  };
  banner: {
    enabled: boolean;
    imageUrl: string;
    href: string;
    titleI18n: ShopLocalizedText;
    subtitleI18n: ShopLocalizedText;
  };
  market: {
    defaultCountryCode: string | null;
    defaultCurrencyCode: string | null;
  };
};
