"use client";

import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { getCountryByCode } from "@/lib/shop/catalog";
import type { CurrencyCode } from "@/lib/shop/types";
import { ShopToolbarSelect } from "@/components/shop/toolbar/ShopToolbarSelect";
import { cn } from "@/lib/utils";

export function CurrencySelector({ className }: { className?: string }) {
  const t = useTranslations("shop");
  const { countryCode, currency, setCurrency } = useShop();
  const selectedCountry = countryCode ? getCountryByCode(countryCode) : null;

  return (
    <ShopToolbarSelect
      className={cn("min-w-[8rem]", className)}
      label={t("selectCurrency")}
      value={currency ?? ""}
      placeholder={t("chooseCurrency")}
      disabled={!selectedCountry}
      options={(selectedCountry?.currencies ?? []).map((code) => ({
        value: code,
        label: code,
      }))}
      onChange={(value) => setCurrency(value as CurrencyCode)}
    />
  );
}
