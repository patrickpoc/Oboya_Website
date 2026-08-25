"use client";

import { useEffect, useRef, useState } from "react";
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

  const [collapsed, setCollapsed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCollapsed(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Sentinel: collapse triggers when this scrolls behind the sticky navbar */}
      <div ref={sentinelRef} className="pointer-events-none h-px" aria-hidden />

      <div ref={toolbarRef} className="sticky top-16 z-30 border-b border-border/60 bg-white/95 shadow-sm backdrop-blur-md md:top-20">
        <Container className="py-4">
          <div className="flex flex-col gap-4">
            {/* Controls that hide on mobile scroll */}
            <div
              className={`flex flex-col gap-3 transition-all duration-300 md:!max-h-none md:!opacity-100 md:!overflow-visible lg:flex-row lg:items-end lg:gap-4 ${
                collapsed
                  ? "max-h-0 opacity-0 overflow-hidden !py-0 !gap-0 !mt-0 !mb-0"
                  : "max-h-[500px] opacity-100"
              }`}
            >
              <CountrySelector className="lg:w-48" />
              <CurrencySelector className="lg:w-32" />
              <div className="hidden min-w-[14rem] flex-1 lg:block">
                <SearchBar />
              </div>
              <SortDropdown className="lg:w-44" />
              <ViewSwitcher className="lg:w-28" />
            </div>

            {/* Search bar + Filters button — always visible on mobile */}
            <div className="flex gap-2 lg:hidden">
              <div className="flex-1">
                <SearchBar />
              </div>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                disabled={!countryCode}
                className={buttonVariants({
                  variant: "outline",
                  className: "h-10 shrink-0 rounded-lg border-border",
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
    </>
  );
}
