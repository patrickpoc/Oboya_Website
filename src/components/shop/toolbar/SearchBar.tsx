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
      <span className="sr-only">{t("searchPlaceholder")}</span>
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
        className="h-10 w-full rounded-lg border border-border bg-white pr-9 pl-9 text-sm text-oboya-blue-dark shadow-sm placeholder:text-muted-foreground disabled:opacity-50"
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
    </label>
  );
}
