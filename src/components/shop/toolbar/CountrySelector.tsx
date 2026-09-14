"use client";

import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { CountryFlag } from "@/components/ui/country-flag";
import { ShopToolbarSelect } from "@/components/shop/toolbar/ShopToolbarSelect";
import { cn } from "@/lib/utils";

const FLAG_W = 21;
const FLAG_H = 14;

function FlagMark({ code }: { code: string }) {
  return (
    <span
      className="shrink-0 overflow-hidden rounded-[2px] border border-border/40 leading-none"
      style={{ width: FLAG_W, height: FLAG_H }}
      aria-hidden
    >
      <CountryFlag
        code={code}
        className="block"
        style={{ width: FLAG_W, height: FLAG_H, display: "block" }}
      />
    </span>
  );
}

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
    <ShopToolbarSelect
      className={cn("min-w-[11rem]", className)}
      label={t("selectCountry")}
      value={countryCode ?? ""}
      placeholder={t("chooseCountry")}
      minMenuWidth={192}
      options={countries.map((country) => ({
        value: country.code,
        label: country.name,
        leading: <FlagMark code={country.code} />,
      }))}
      onChange={handleChange}
    />
  );
}
