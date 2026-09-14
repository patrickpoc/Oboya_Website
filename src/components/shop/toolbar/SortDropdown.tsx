"use client";

import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import type { SortOption } from "@/lib/shop/types";
import { ShopToolbarSelect } from "@/components/shop/toolbar/ShopToolbarSelect";
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
    <ShopToolbarSelect
      className={cn("min-w-[9rem]", className)}
      label={t("sortBy")}
      value={sort}
      placeholder={t("sortBy")}
      disabled={!countryCode}
      minMenuWidth={176}
      options={SORT_OPTIONS.map((option) => ({
        value: option,
        label: t(`sort.${option}`),
      }))}
      onChange={setSort}
    />
  );
}
