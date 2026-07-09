"use client";

import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { CountryFlag } from "@/components/ui/country-flag";
import { cn } from "@/lib/utils";

export function CountrySelector({ className }: { className?: string }) {
  const t = useTranslations("shop");
  const { countries, countryCode, setCountry } = useShop();

  return (
    <label className={cn("block min-w-[10rem]", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {t("selectCountry")}
      </span>
      <div className="relative">
        {countryCode && (
          <span className="pointer-events-none absolute top-1/2 left-3 inline-flex aspect-[3/2] h-4 -translate-y-1/2 overflow-hidden rounded-[2px] border border-border/40">
            <CountryFlag code={countryCode} className="h-full w-full" />
          </span>
        )}
        <select
          value={countryCode ?? ""}
          onChange={(event) => setCountry(event.target.value)}
          className={cn(
            "h-10 w-full rounded-lg border border-border bg-white text-sm text-oboya-blue-dark shadow-sm",
            countryCode ? "pl-10 pr-3" : "px-3"
          )}
        >
          <option value="">{t("chooseCountry")}</option>
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
