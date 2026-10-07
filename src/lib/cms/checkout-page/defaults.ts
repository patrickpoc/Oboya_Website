import type { ShopLocalizedText } from "@/lib/shop/types";
import type { CheckoutPageSettings } from "@/lib/cms/checkout-page/types";

export const CHECKOUT_UPSELL_MIN = 1;
export const CHECKOUT_UPSELL_MAX = 8;

function emptyLocalized(): ShopLocalizedText {
  return { en: "", "pt-BR": "", es: "", "zh-CN": "" };
}

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

function normalizeFlag(raw: unknown, fallback: boolean): boolean {
  return typeof raw === "boolean" ? raw : fallback;
}

export const DEFAULT_CHECKOUT_PAGE: CheckoutPageSettings = {
  seo: {
    titleI18n: emptyLocalized(),
    descriptionI18n: emptyLocalized(),
  },
  sections: {
    greeting: true,
    freight: true,
    coupon: true,
    upsell: true,
    trust: true,
  },
  upsell: {
    maxItems: 2,
    categoryId: null,
  },
  copy: {
    greetingI18n: emptyLocalized(),
    freightTitleI18n: emptyLocalized(),
    freightHintI18n: emptyLocalized(),
    freightUnavailableI18n: emptyLocalized(),
    couponTitleI18n: emptyLocalized(),
    couponUnavailableI18n: emptyLocalized(),
    trustI18n: emptyLocalized(),
    emptyTitleI18n: emptyLocalized(),
    emptyBodyI18n: emptyLocalized(),
  },
};

export function normalizeCheckoutPage(raw: unknown): CheckoutPageSettings {
  const root = asRecord(raw);
  const seo = asRecord(root.seo);
  const sections = asRecord(root.sections);
  const upsell = asRecord(root.upsell);
  const copy = asRecord(root.copy);
  const maxRaw = Number(upsell.maxItems);
  const maxItems = Number.isFinite(maxRaw)
    ? Math.min(CHECKOUT_UPSELL_MAX, Math.max(CHECKOUT_UPSELL_MIN, Math.round(maxRaw)))
    : DEFAULT_CHECKOUT_PAGE.upsell.maxItems;
  const categoryId =
    typeof upsell.categoryId === "string" && upsell.categoryId.trim()
      ? upsell.categoryId.trim()
      : null;

  return {
    seo: {
      titleI18n: normalizeLocalized(seo.titleI18n),
      descriptionI18n: normalizeLocalized(seo.descriptionI18n),
    },
    sections: {
      greeting: normalizeFlag(sections.greeting, true),
      freight: normalizeFlag(sections.freight, true),
      coupon: normalizeFlag(sections.coupon, true),
      upsell: normalizeFlag(sections.upsell, true),
      trust: normalizeFlag(sections.trust, true),
    },
    upsell: { maxItems, categoryId },
    copy: {
      greetingI18n: normalizeLocalized(copy.greetingI18n),
      freightTitleI18n: normalizeLocalized(copy.freightTitleI18n),
      freightHintI18n: normalizeLocalized(copy.freightHintI18n),
      freightUnavailableI18n: normalizeLocalized(copy.freightUnavailableI18n),
      couponTitleI18n: normalizeLocalized(copy.couponTitleI18n),
      couponUnavailableI18n: normalizeLocalized(copy.couponUnavailableI18n),
      trustI18n: normalizeLocalized(copy.trustI18n),
      emptyTitleI18n: normalizeLocalized(copy.emptyTitleI18n),
      emptyBodyI18n: normalizeLocalized(copy.emptyBodyI18n),
    },
  };
}

export function validateCheckoutPageForSave(settings: CheckoutPageSettings): string | null {
  if (
    settings.upsell.maxItems < CHECKOUT_UPSELL_MIN ||
    settings.upsell.maxItems > CHECKOUT_UPSELL_MAX
  ) {
    return `Upsell count must be between ${CHECKOUT_UPSELL_MIN} and ${CHECKOUT_UPSELL_MAX}.`;
  }
  return null;
}
