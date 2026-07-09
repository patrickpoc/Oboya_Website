"use client";

import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import type { SortOption } from "@/lib/shop/types";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: SortOption[] = [
  "relevance",
  "name_asc",
  "name_desc",
  "price_asc",
  "price_desc",
  "availability",
];

export function SortDropdown({ className }: { className?: string }) {
  const t = useTranslations("shop");
  const { sort, setSort, countryCode } = useShop();

  return (
    <label className={cn("block min-w-[9rem]", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {t("sortBy")}
      </span>
      <select
        value={sort}
        onChange={(event) => setSort(event.target.value as SortOption)}
        disabled={!countryCode}
        className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-oboya-blue-dark shadow-sm disabled:opacity-50"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {t(`sort.${option}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
