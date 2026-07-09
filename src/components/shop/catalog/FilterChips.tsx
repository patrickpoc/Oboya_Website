"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { getBrandById, getCategoryById } from "@/lib/shop/catalog";

export function FilterChips() {
  const t = useTranslations("shop");
  const { filters, updateFilters, clearFilters, activeFilterCount } = useShop();

  if (activeFilterCount === 0) return null;

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.categoryId) {
    const cat = getCategoryById(filters.categoryId);
    chips.push({
      key: `cat-${filters.categoryId}`,
      label: cat?.name ?? filters.categoryId,
      onRemove: () => updateFilters({ categoryId: null, subcategoryIds: [] }),
    });
  }

  for (const id of filters.subcategoryIds) {
    chips.push({
      key: `sub-${id}`,
      label: id,
      onRemove: () =>
        updateFilters({
          subcategoryIds: filters.subcategoryIds.filter((s) => s !== id),
        }),
    });
  }

  for (const id of filters.brandIds) {
    chips.push({
      key: `brand-${id}`,
      label: getBrandById(id)?.name ?? id,
      onRemove: () =>
        updateFilters({ brandIds: filters.brandIds.filter((b) => b !== id) }),
    });
  }

  if (filters.availabilityOnly) {
    chips.push({
      key: "available",
      label: t("inStockOnly"),
      onRemove: () => updateFilters({ availabilityOnly: false }),
    });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 text-xs text-oboya-blue-dark hover:border-oboya-green/40"
        >
          {chip.label}
          <X className="size-3" />
        </button>
      ))}
      <button
        type="button"
        onClick={clearFilters}
        className="text-xs font-medium text-oboya-green hover:underline"
      >
        {t("clearFilters")}
      </button>
    </div>
  );
}
