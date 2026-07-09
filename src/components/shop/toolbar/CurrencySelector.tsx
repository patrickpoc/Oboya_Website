"use client";

import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { getCountryByCode } from "@/lib/shop/catalog";
import type { CurrencyCode } from "@/lib/shop/types";
import { cn } from "@/lib/utils";

export function CurrencySelector({ className }: { className?: string }) {
  const t = useTranslations("shop");
  const { countryCode, currency, setCurrency } = useShop();
  const selectedCountry = countryCode ? getCountryByCode(countryCode) : null;

  return (
    <label className={cn("block min-w-[8rem]", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {t("selectCurrency")}
      </span>
      <select
        value={currency ?? ""}
        onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
        disabled={!selectedCountry}
        className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-oboya-blue-dark shadow-sm disabled:opacity-50"
      >
        <option value="">{t("chooseCurrency")}</option>
        {selectedCountry?.currencies.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </label>
  );
}
