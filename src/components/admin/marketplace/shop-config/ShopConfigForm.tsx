"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ImageField } from "@/components/admin/media/ImageField";
import { LocalizedFieldGrid } from "@/components/admin/marketplace/LocalizedFieldGrid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SHOP_CONFIG_PAGE_SIZES,
  SHOP_CONFIG_RFQ_FIELD_KEYS,
  type ShopConfig,
  type ShopConfigRfqFieldKey,
} from "@/lib/cms/shop-config/types";
import type { CmsLocale, LocalizedString } from "@/lib/cms/types";
import type { ShopCountry, SortOption, ViewMode } from "@/lib/shop/types";

type Props = {
  value: ShopConfig;
  onChange: (next: ShopConfig) => void;
  countries: ShopCountry[];
};

const SORT_OPTIONS: SortOption[] = [
  "relevance",
  "name_asc",
  "name_desc",
  "price_asc",
  "price_desc",
  "availability",
];

function asLocalizedString(value: ShopConfig["rfq"]["introI18n"]): LocalizedString {
  return {
    en: value.en ?? "",
    "pt-BR": value["pt-BR"] ?? "",
    es: value.es ?? "",
    "zh-CN": value["zh-CN"] ?? "",
  };
}

export function ShopConfigForm({ value, onChange, countries }: Props) {
  const t = useTranslations("admin.shopConfig");

  const selectedCountry = useMemo(
    () =>
      countries.find((country) => country.code === value.market.defaultCountryCode) ??
      null,
    [countries, value.market.defaultCountryCode]
  );

  const patch = (partial: Partial<ShopConfig>) => {
    onChange({ ...value, ...partial });
  };

  const setLocalized = (
    section: "rfq" | "banner",
    key: "introI18n" | "confirmationI18n" | "titleI18n" | "subtitleI18n",
    locale: CmsLocale,
    nextValue: string
  ) => {
    if (section === "rfq" && (key === "introI18n" || key === "confirmationI18n")) {
      patch({
        rfq: {
          ...value.rfq,
          [key]: { ...value.rfq[key], [locale]: nextValue },
        },
      });
      return;
    }
    if (section === "banner" && (key === "titleI18n" || key === "subtitleI18n")) {
      patch({
        banner: {
          ...value.banner,
          [key]: { ...value.banner[key], [locale]: nextValue },
        },
      });
    }
  };

  const setRfqField = (
    fieldKey: ShopConfigRfqFieldKey,
    patchField: Partial<ShopConfig["rfq"]["fields"][ShopConfigRfqFieldKey]>
  ) => {
    const current = value.rfq.fields[fieldKey];
    const next = { ...current, ...patchField };
    if (next.required) next.visible = true;
    patch({
      rfq: {
        ...value.rfq,
        fields: { ...value.rfq.fields, [fieldKey]: next },
      },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-oboya-blue-dark">
            {t("catalogSection")}
          </CardTitle>
          <CardDescription>{t("catalogHint")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>{t("defaultView")}</Label>
            <Select
              value={value.catalog.defaultViewMode}
              onValueChange={(next) =>
                patch({
                  catalog: {
                    ...value.catalog,
                    defaultViewMode: next as ViewMode,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">{t("viewGrid")}</SelectItem>
                <SelectItem value="list">{t("viewList")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("defaultSort")}</Label>
            <Select
              value={value.catalog.defaultSort}
              onValueChange={(next) =>
                patch({
                  catalog: {
                    ...value.catalog,
                    defaultSort: next as SortOption,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`sort_${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("pageSize")}</Label>
            <Select
              value={String(value.catalog.pageSize)}
              onValueChange={(next) =>
                patch({
                  catalog: {
                    ...value.catalog,
                    pageSize: Number(next) as ShopConfig["catalog"]["pageSize"],
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHOP_CONFIG_PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t("pageSizeHint")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-oboya-blue-dark">
            {t("rfqSection")}
          </CardTitle>
          <CardDescription>{t("rfqHint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={value.rfq.enabled}
              onCheckedChange={(checked) =>
                patch({ rfq: { ...value.rfq, enabled: checked === true } })
              }
            />
            {t("rfqEnabled")}
          </label>

          <div className="space-y-2">
            <p className="text-sm font-medium text-oboya-blue-dark">{t("rfqFields")}</p>
            <p className="text-xs text-muted-foreground">{t("rfqPrivacyNote")}</p>
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="bg-oboya-soft-white text-xs uppercase tracking-wide text-oboya-blue-dark/70">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t("fieldColumn")}</th>
                    <th className="px-3 py-2 font-medium">{t("rfqVisible")}</th>
                    <th className="px-3 py-2 font-medium">{t("rfqRequired")}</th>
                  </tr>
                </thead>
                <tbody>
                  {SHOP_CONFIG_RFQ_FIELD_KEYS.map((key) => {
                    const field = value.rfq.fields[key];
                    return (
                      <tr key={key} className="border-t border-border/50">
                        <td className="px-3 py-2">{t(`field_${key}`)}</td>
                        <td className="px-3 py-2">
                          <Checkbox
                            checked={field.visible}
                            disabled={!value.rfq.enabled || field.required}
                            onCheckedChange={(checked) =>
                              setRfqField(key, { visible: checked === true })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Checkbox
                            checked={field.required}
                            disabled={!value.rfq.enabled}
                            onCheckedChange={(checked) =>
                              setRfqField(key, { required: checked === true })
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <LocalizedFieldGrid
            label={t("rfqIntro")}
            value={asLocalizedString(value.rfq.introI18n)}
            multiline
            rows={3}
            onChange={(locale, next) => setLocalized("rfq", "introI18n", locale, next)}
          />
          <p className="-mt-3 text-xs text-muted-foreground">{t("rfqIntroHint")}</p>
          <LocalizedFieldGrid
            label={t("rfqConfirmation")}
            value={asLocalizedString(value.rfq.confirmationI18n)}
            multiline
            rows={3}
            onChange={(locale, next) =>
              setLocalized("rfq", "confirmationI18n", locale, next)
            }
          />
          <p className="-mt-3 text-xs text-muted-foreground">
            {t("rfqConfirmationHint")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-oboya-blue-dark">
            {t("bannerSection")}
          </CardTitle>
          <CardDescription>{t("bannerHint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={value.banner.enabled}
              onCheckedChange={(checked) =>
                patch({
                  banner: { ...value.banner, enabled: checked === true },
                })
              }
            />
            {t("bannerEnabled")}
          </label>
          <ImageField
            label={t("bannerImage")}
            value={value.banner.imageUrl}
            optional
            onChange={(url) =>
              patch({ banner: { ...value.banner, imageUrl: url } })
            }
          />
          <div className="space-y-1.5">
            <Label htmlFor="shop-banner-href">{t("bannerHref")}</Label>
            <Input
              id="shop-banner-href"
              value={value.banner.href}
              placeholder={t("bannerHrefPlaceholder")}
              onChange={(event) =>
                patch({
                  banner: { ...value.banner, href: event.target.value },
                })
              }
            />
          </div>
          <LocalizedFieldGrid
            label={t("bannerTitle")}
            value={asLocalizedString(value.banner.titleI18n)}
            onChange={(locale, next) => setLocalized("banner", "titleI18n", locale, next)}
          />
          <LocalizedFieldGrid
            label={t("bannerSubtitle")}
            value={asLocalizedString(value.banner.subtitleI18n)}
            multiline
            rows={2}
            onChange={(locale, next) =>
              setLocalized("banner", "subtitleI18n", locale, next)
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-oboya-blue-dark">
            {t("marketSection")}
          </CardTitle>
          <CardDescription>{t("marketHint")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("defaultCountry")}</Label>
            <Select
              value={value.market.defaultCountryCode ?? "__none__"}
              onValueChange={(next) => {
                if (next === "__none__") {
                  patch({
                    market: {
                      defaultCountryCode: null,
                      defaultCurrencyCode: null,
                    },
                  });
                  return;
                }
                const country = countries.find((item) => item.code === next);
                patch({
                  market: {
                    defaultCountryCode: next,
                    defaultCurrencyCode:
                      country?.defaultCurrency?.toUpperCase() ?? null,
                  },
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("none")}</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name || country.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("defaultCurrency")}</Label>
            <Select
              value={value.market.defaultCurrencyCode ?? "__country__"}
              disabled={!selectedCountry}
              onValueChange={(next) =>
                patch({
                  market: {
                    ...value.market,
                    defaultCurrencyCode:
                      next === "__country__"
                        ? selectedCountry?.defaultCurrency?.toUpperCase() ?? null
                        : next,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("useCountryDefault")} />
              </SelectTrigger>
              <SelectContent>
                {selectedCountry ? (
                  selectedCountry.currencies.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                      {code === selectedCountry.defaultCurrency
                        ? ` (${t("useCountryDefault")})`
                        : ""}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__country__">{t("none")}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
