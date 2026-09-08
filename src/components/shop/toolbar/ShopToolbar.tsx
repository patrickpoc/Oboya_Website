"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { useShop } from "@/contexts/ShopContext";
import { CountrySelector } from "@/components/shop/toolbar/CountrySelector";
import { CurrencySelector } from "@/components/shop/toolbar/CurrencySelector";
import { SearchBar } from "@/components/shop/toolbar/SearchBar";
import { SortDropdown } from "@/components/shop/toolbar/SortDropdown";
import { ViewSwitcher } from "@/components/shop/toolbar/ViewSwitcher";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useIsLargeScreen() {
  const [isLarge, setIsLarge] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLarge(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isLarge;
}

export function ShopToolbar() {
  const t = useTranslations("shop");
  const { activeFilterCount, setFilterDrawerOpen, countryCode } = useShop();
  const panelId = useId();
  const isLarge = useIsLargeScreen();
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const searchField = (
    <div className={cn(isLarge ? "min-w-[14rem] flex-1" : "min-w-0 flex-1")}>
      <SearchBar />
    </div>
  );

  return (
    <div className="sticky top-16 z-30 border-b border-border/60 bg-white/95 shadow-sm backdrop-blur-md md:top-20">
      <Container className="py-3 sm:py-4">
        {isLarge ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <CountrySelector className="lg:w-48" />
            <CurrencySelector className="lg:w-32" />
            {searchField}
            <SortDropdown className="lg:w-44" />
            <ViewSwitcher className="lg:w-28" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              {searchField}
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                disabled={!countryCode}
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "h-10 min-h-10 shrink-0 rounded-lg border-border px-2.5 sm:px-3",
                })}
              >
                <SlidersHorizontal className="size-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("filters")}</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-oboya-green px-1.5 text-[10px] font-semibold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setMobileExpanded((open) => !open)}
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "h-10 min-h-10 shrink-0 rounded-lg border-border px-2.5",
                })}
                aria-expanded={mobileExpanded}
                aria-controls={panelId}
                aria-label={
                  mobileExpanded ? t("collapseToolbar") : t("expandToolbar")
                }
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-200",
                    mobileExpanded && "rotate-180"
                  )}
                />
              </button>
            </div>

            <div
              id={panelId}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                mobileExpanded
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col gap-3 pb-1 pt-0.5">
                  <CountrySelector />
                  <CurrencySelector />
                  <SortDropdown />
                  <ViewSwitcher />
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
