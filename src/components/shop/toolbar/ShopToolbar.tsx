"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { useShop } from "@/contexts/ShopContext";
import { CountrySelector } from "@/components/shop/toolbar/CountrySelector";
import { CurrencySelector } from "@/components/shop/toolbar/CurrencySelector";
import { SearchBar } from "@/components/shop/toolbar/SearchBar";
import { SortDropdown } from "@/components/shop/toolbar/SortDropdown";
import { ViewSwitcher } from "@/components/shop/toolbar/ViewSwitcher";
import { buttonVariants } from "@/components/ui/button";

export function ShopToolbar() {
  const t = useTranslations("shop");
  const { activeFilterCount, setFilterDrawerOpen, countryCode } = useShop();

  return (
    <div className="sticky top-16 z-30 border-b border-border/60 bg-white/95 shadow-sm backdrop-blur-md md:top-20">
      <Container className="py-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <CountrySelector className="lg:w-44" />
            <CurrencySelector className="lg:w-36" />
            <SearchBar />
            <SortDropdown className="lg:w-40" />
            <ViewSwitcher className="lg:w-24" />
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              disabled={!countryCode}
              className={buttonVariants({
                variant: "outline",
                className:
                  "h-10 shrink-0 rounded-lg border-border lg:hidden",
              })}
            >
              <SlidersHorizontal className="mr-2 size-4" />
              {t("filters")}
              {activeFilterCount > 0 && (
                <span className="ml-1.5 rounded-full bg-oboya-green px-1.5 text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}
