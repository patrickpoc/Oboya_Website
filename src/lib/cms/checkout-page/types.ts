import type { ShopLocalizedText } from "@/lib/shop/types";

export type CheckoutPageSettings = {
  seo: {
    titleI18n: ShopLocalizedText;
    descriptionI18n: ShopLocalizedText;
  };
  sections: {
    greeting: boolean;
    freight: boolean;
    coupon: boolean;
    upsell: boolean;
    trust: boolean;
  };
  upsell: {
    maxItems: number;
    categoryId: string | null;
  };
  copy: {
    greetingI18n: ShopLocalizedText;
    freightTitleI18n: ShopLocalizedText;
    freightHintI18n: ShopLocalizedText;
    freightUnavailableI18n: ShopLocalizedText;
    couponTitleI18n: ShopLocalizedText;
    couponUnavailableI18n: ShopLocalizedText;
    trustI18n: ShopLocalizedText;
    emptyTitleI18n: ShopLocalizedText;
    emptyBodyI18n: ShopLocalizedText;
  };
};
