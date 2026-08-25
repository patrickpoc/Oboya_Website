"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { cn } from "@/lib/utils";

export function SearchBar({ className }: { className?: string }) {
  const t = useTranslations("shop");
  const { search, setSearch, countryCode } = useShop();

  return (
    <label className={cn("relative block min-w-0 flex-1", className)}>
      {/* Match labeled controls on desktop; hide spacer on mobile-only search row */}
      <span
        className="mb-1.5 hidden text-xs font-medium text-transparent select-none lg:block"
        aria-hidden
      >
        &nbsp;
      </span>
      <span className="sr-only">{t("searchPlaceholder")}</span>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          disabled={!countryCode}
          placeholder={t("searchPlaceholder")}
          className={cn(
            "h-10 w-full rounded-lg border border-border bg-white pl-10 text-sm leading-normal text-oboya-blue-dark shadow-sm placeholder:text-muted-foreground disabled:opacity-50",
            "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
            search ? "pr-9" : "pr-3"
          )}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-oboya-blue-dark"
            aria-label={t("clearSearch")}
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </label>
  );
}
