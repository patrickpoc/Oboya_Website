"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { getBrandById, getCategoryById } from "@/lib/shop/catalog";
import type { ShopLocalizedText } from "@/lib/shop/types";

function pickLabel(
  locale: string,
  fallback: string,
  localized?: ShopLocalizedText
) {
  const key = locale as keyof ShopLocalizedText;
  return localized?.[key]?.trim() || localized?.en?.trim() || fallback;
}

export function FilterChips() {
  const t = useTranslations("shop");
  const locale = useLocale();
  const {
    filters,
    updateFilters,
    clearFilters,
    activeFilterCount,
    filterOptions,
    categories,
  } = useShop();

  if (activeFilterCount === 0) return null;

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.categoryId) {
    const cat = getCategoryById(filters.categoryId);
    chips.push({
      key: `cat-${filters.categoryId}`,
      label: pickLabel(locale, cat?.name ?? filters.categoryId, cat?.nameI18n),
      onRemove: () => updateFilters({ categoryId: null, subcategoryIds: [] }),
    });
  }

  for (const id of filters.subcategoryIds) {
    const category = categories.find((item) =>
      item.subcategories.some((sub) => sub.id === id)
    );
    const sub = category?.subcategories.find((item) => item.id === id);
    chips.push({
      key: `sub-${id}`,
      label: pickLabel(locale, sub?.name ?? id, sub?.nameI18n),
      onRemove: () =>
        updateFilters({
          subcategoryIds: filters.subcategoryIds.filter((s) => s !== id),
        }),
    });
  }

  for (const id of filters.brandIds) {
    const brand = getBrandById(id);
    chips.push({
      key: `brand-${id}`,
      label: pickLabel(locale, brand?.name ?? id, brand?.nameI18n),
      onRemove: () =>
        updateFilters({ brandIds: filters.brandIds.filter((b) => b !== id) }),
    });
  }

  for (const id of filters.applications) {
    const option = filterOptions.applications.find((item) => item.id === id);
    chips.push({
      key: `app-${id}`,
      label: pickLabel(locale, option?.name ?? id, option?.nameI18n),
      onRemove: () =>
        updateFilters({
          applications: filters.applications.filter((item) => item !== id),
        }),
    });
  }

  for (const id of filters.cultures) {
    const option = filterOptions.cultures.find((item) => item.id === id);
    chips.push({
      key: `culture-${id}`,
      label: pickLabel(locale, option?.name ?? id, option?.nameI18n),
      onRemove: () =>
        updateFilters({
          cultures: filters.cultures.filter((item) => item !== id),
        }),
    });
  }

  for (const id of filters.certifications) {
    const option = filterOptions.certifications.find((item) => item.id === id);
    chips.push({
      key: `cert-${id}`,
      label: pickLabel(locale, option?.name ?? id, option?.nameI18n),
      onRemove: () =>
        updateFilters({
          certifications: filters.certifications.filter((item) => item !== id),
        }),
    });
  }

  for (const id of filters.countriesOfOrigin) {
    const option = filterOptions.countriesOfOrigin.find((item) => item.id === id);
    chips.push({
      key: `origin-${id}`,
      label: pickLabel(locale, option?.name ?? id, option?.nameI18n),
      onRemove: () =>
        updateFilters({
          countriesOfOrigin: filters.countriesOfOrigin.filter(
            (item) => item !== id
          ),
        }),
    });
  }

  if (filters.availabilityOnly) {
    chips.push({
      key: "available",
      label: t("inStockOnly"),
      onRemove: () => updateFilters({ availabilityOnly: false }),
    });
  }

  if (filters.priceMin !== null) {
    chips.push({
      key: "price-min",
      label: `${t("priceMin")}: ${filters.priceMin}`,
      onRemove: () => updateFilters({ priceMin: null }),
    });
  }

  if (filters.priceMax !== null) {
    chips.push({
      key: "price-max",
      label: `${t("priceMax")}: ${filters.priceMax}`,
      onRemove: () => updateFilters({ priceMax: null }),
    });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          aria-label={t("removeFilter", { label: chip.label })}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 text-xs text-oboya-blue-dark hover:border-oboya-green/40"
        >
          {chip.label}
          <X className="size-3" aria-hidden />
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
