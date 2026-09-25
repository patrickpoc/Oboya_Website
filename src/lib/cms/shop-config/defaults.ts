import type { ShopCountry, ShopLocalizedText, SortOption, ViewMode } from "@/lib/shop/types";
import {
  SHOP_CONFIG_PAGE_SIZES,
  SHOP_CONFIG_RFQ_FIELD_KEYS,
  type ShopConfig,
  type ShopConfigPageSize,
  type ShopConfigRfqField,
  type ShopConfigRfqFieldKey,
} from "@/lib/cms/shop-config/types";

const SORT_OPTIONS: SortOption[] = [
  "relevance",
  "name_asc",
  "name_desc",
  "price_asc",
  "price_desc",
  "availability",
];

const VIEW_MODES: ViewMode[] = ["grid", "list"];

function emptyLocalized(): ShopLocalizedText {
  return { en: "", "pt-BR": "", es: "", "zh-CN": "" };
}

function field(visible: boolean, required: boolean): ShopConfigRfqField {
  return { visible, required: required ? true : false };
}

function defaultRfqFields(): ShopConfig["rfq"]["fields"] {
  return {
    company: field(true, true),
    contactName: field(true, true),
    email: field(true, true),
    phone: field(true, true),
    country: field(true, true),
    message: field(true, false),
    marketingOptIn: field(true, false),
  };
}

export const DEFAULT_SHOP_CONFIG: ShopConfig = {
  catalog: {
    defaultViewMode: "grid",
    defaultSort: "relevance",
    pageSize: 24,
  },
  rfq: {
    enabled: true,
    fields: defaultRfqFields(),
    introI18n: emptyLocalized(),
    confirmationI18n: emptyLocalized(),
  },
  banner: {
    enabled: false,
    imageUrl: "",
    href: "",
    titleI18n: emptyLocalized(),
    subtitleI18n: emptyLocalized(),
  },
  market: {
    defaultCountryCode: null,
    defaultCurrencyCode: null,
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function normalizeLocalized(raw: unknown): ShopLocalizedText {
  const source = asRecord(raw);
  const next = emptyLocalized();
  for (const key of ["en", "pt-BR", "es", "zh-CN"] as const) {
    const value = source[key];
    next[key] = typeof value === "string" ? value : "";
  }
  return next;
}

function normalizePageSize(raw: unknown): ShopConfigPageSize {
  const num = Number(raw);
  if ((SHOP_CONFIG_PAGE_SIZES as readonly number[]).includes(num)) {
    return num as ShopConfigPageSize;
  }
  return DEFAULT_SHOP_CONFIG.catalog.pageSize;
}

function normalizeRfqField(raw: unknown, fallback: ShopConfigRfqField): ShopConfigRfqField {
  const source = asRecord(raw);
  const visible =
    typeof source.visible === "boolean" ? source.visible : fallback.visible;
  let required =
    typeof source.required === "boolean" ? source.required : fallback.required;
  if (required) {
    return { visible: true, required: true };
  }
  return { visible, required: false };
}

export type NormalizeShopConfigOptions = {
  countries?: ShopCountry[];
};

/**
 * Fill defaults, clamp enums, and optionally drop invalid market country/currency.
 */
export function normalizeShopConfig(
  raw: unknown,
  options?: NormalizeShopConfigOptions
): ShopConfig {
  const root = asRecord(raw);
  const catalogRaw = asRecord(root.catalog);
  const rfqRaw = asRecord(root.rfq);
  const bannerRaw = asRecord(root.banner);
  const marketRaw = asRecord(root.market);
  const fieldsRaw = asRecord(rfqRaw.fields);

  const viewMode = catalogRaw.defaultViewMode;
  const sort = catalogRaw.defaultSort;

  const fields = { ...defaultRfqFields() };
  for (const key of SHOP_CONFIG_RFQ_FIELD_KEYS) {
    fields[key] = normalizeRfqField(fieldsRaw[key], fields[key]);
  }

  let defaultCountryCode =
    typeof marketRaw.defaultCountryCode === "string" &&
    marketRaw.defaultCountryCode.trim()
      ? marketRaw.defaultCountryCode.trim().toUpperCase()
      : null;
  let defaultCurrencyCode =
    typeof marketRaw.defaultCurrencyCode === "string" &&
    marketRaw.defaultCurrencyCode.trim()
      ? marketRaw.defaultCurrencyCode.trim().toUpperCase()
      : null;

  const countries = options?.countries;
  if (countries && countries.length > 0) {
    if (defaultCountryCode) {
      const country = countries.find((item) => item.code === defaultCountryCode);
      if (!country) {
        defaultCountryCode = null;
        defaultCurrencyCode = null;
      } else {
        const allowed = country.currencies.map((code) => code.toUpperCase());
        if (
          defaultCurrencyCode &&
          !allowed.includes(defaultCurrencyCode)
        ) {
          defaultCurrencyCode = country.defaultCurrency.toUpperCase();
        }
        if (!defaultCurrencyCode) {
          defaultCurrencyCode = country.defaultCurrency.toUpperCase();
        }
      }
    } else {
      defaultCurrencyCode = null;
    }
  }

  const bannerEnabled = Boolean(bannerRaw.enabled);
  const imageUrl =
    typeof bannerRaw.imageUrl === "string" ? bannerRaw.imageUrl.trim() : "";

  return {
    catalog: {
      defaultViewMode: VIEW_MODES.includes(viewMode as ViewMode)
        ? (viewMode as ViewMode)
        : DEFAULT_SHOP_CONFIG.catalog.defaultViewMode,
      defaultSort: SORT_OPTIONS.includes(sort as SortOption)
        ? (sort as SortOption)
        : DEFAULT_SHOP_CONFIG.catalog.defaultSort,
      pageSize: normalizePageSize(catalogRaw.pageSize),
    },
    rfq: {
      enabled:
        typeof rfqRaw.enabled === "boolean"
          ? rfqRaw.enabled
          : DEFAULT_SHOP_CONFIG.rfq.enabled,
      fields,
      introI18n: normalizeLocalized(rfqRaw.introI18n),
      confirmationI18n: normalizeLocalized(rfqRaw.confirmationI18n),
    },
    banner: {
      enabled: bannerEnabled && Boolean(imageUrl),
      imageUrl,
      href: typeof bannerRaw.href === "string" ? bannerRaw.href.trim() : "",
      titleI18n: normalizeLocalized(bannerRaw.titleI18n),
      subtitleI18n: normalizeLocalized(bannerRaw.subtitleI18n),
    },
    market: {
      defaultCountryCode,
      defaultCurrencyCode,
    },
  };
}

export function validateShopConfigForSave(config: ShopConfig): string | null {
  if (config.banner.enabled && !config.banner.imageUrl.trim()) {
    return "Banner requires an image when enabled.";
  }
  for (const key of SHOP_CONFIG_RFQ_FIELD_KEYS) {
    const fieldCfg = config.rfq.fields[key as ShopConfigRfqFieldKey];
    if (fieldCfg.required && !fieldCfg.visible) {
      return `RFQ field "${key}" cannot be required while hidden.`;
    }
  }
  return null;
}
