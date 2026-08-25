"use client";

import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { CountryFlag } from "@/components/ui/country-flag";
import { cn } from "@/lib/utils";

const FLAG_W = 21;
const FLAG_H = 14;

export function CountrySelector({ className }: { className?: string }) {
  const t = useTranslations("shop");
  const { countries, countryCode, setCountry, itemCount } = useShop();

  const handleChange = (nextCode: string) => {
    if (
      itemCount > 0 &&
      nextCode !== (countryCode ?? "") &&
      typeof window !== "undefined" &&
      !window.confirm(t("confirmClearQuoteOnCountryChange"))
    ) {
      return;
    }
    setCountry(nextCode);
  };

  return (
    <label className={cn("block min-w-[11rem]", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {t("selectCountry")}
      </span>
      <div className="flex h-10 items-center gap-2 overflow-hidden rounded-lg border border-border bg-white px-3 shadow-sm">
        {countryCode ? (
          <span
            className="shrink-0 overflow-hidden rounded-[2px] border border-border/40 leading-none"
            style={{ width: FLAG_W, height: FLAG_H }}
            aria-hidden
          >
            <CountryFlag
              code={countryCode}
              className="block"
              style={{ width: FLAG_W, height: FLAG_H, display: "block" }}
            />
          </span>
        ) : null}
        <select
          value={countryCode ?? ""}
          onChange={(event) => handleChange(event.target.value)}
          className="h-full min-w-0 flex-1 cursor-pointer appearance-none border-0 bg-transparent py-0 pr-6 text-sm text-oboya-blue-dark outline-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0 center",
          }}
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
