"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BrandLabel } from "@/components/shop/BrandLabel";
import { useShop } from "@/contexts/ShopContext";
import { getBrandById, getCategoryById } from "@/lib/shop/catalog";
import { pickLocalizedLabel } from "@/lib/shop/localized-label";
import type { ShopLocalizedText } from "@/lib/shop/types";

function pickLabel(
  locale: string,
  fallback: string,
  localized?: ShopLocalizedText
) {
  return pickLocalizedLabel(locale, fallback, localized);
}

export function FilterChips() {
  const t = useTranslations("shop");
  const locale = useLocale();
  const {
    filters,
    updateFilters,
    clearFilters,
    activeFilterCount,
    filterGroups,
    filterOptions,
    categories,
  } = useShop();

  if (activeFilterCount === 0) return null;

  const chips: {
    key: string;
    label: ReactNode;
    ariaLabel: string;
    onRemove: () => void;
  }[] = [];

  if (filters.categoryId) {
    const cat = getCategoryById(filters.categoryId);
    chips.push({
      key: `cat-${filters.categoryId}`,
      label: pickLabel(locale, cat?.name ?? filters.categoryId, cat?.nameI18n),
      ariaLabel: pickLabel(locale, cat?.name ?? filters.categoryId, cat?.nameI18n),
      onRemove: () => updateFilters({ categoryId: null, subcategoryIds: [] }),
    });
  }

  for (const id of filters.subcategoryIds) {
    const category = categories.find((item) =>
      item.subcategories.some((sub) => sub.id === id)
    );
    const sub = category?.subcategories.find((item) => item.id === id);
    const text = pickLabel(locale, sub?.name ?? id, sub?.nameI18n);
    chips.push({
      key: `sub-${id}`,
      label: text,
      ariaLabel: text,
      onRemove: () =>
        updateFilters({
          subcategoryIds: filters.subcategoryIds.filter((s) => s !== id),
        }),
    });
  }

  for (const id of filters.brandIds) {
    const brand = getBrandById(id);
    const brandText = brand
      ? pickLabel(locale, brand.name, brand.nameI18n)
      : id;
    chips.push({
      key: `brand-${id}`,
      label: brand ? (
        <BrandLabel brand={brand} locale={locale} />
      ) : (
        id
      ),
      ariaLabel: brandText,
      onRemove: () =>
        updateFilters({ brandIds: filters.brandIds.filter((b) => b !== id) }),
    });
  }

  for (const group of filterGroups) {
    const selectedIds =
      group.id === "applications"
        ? filters.applications
        : group.id === "cultures"
          ? filters.cultures
          : group.id === "certifications"
            ? filters.certifications
            : group.id === "countriesOfOrigin"
              ? filters.countriesOfOrigin
              : (filters.customFilters?.[group.id] ?? []);
    const options = filterOptions[group.id] ?? [];
    for (const id of selectedIds) {
      const option = options.find((item) => item.id === id);
      const text = pickLabel(locale, option?.name ?? id, option?.nameI18n);
      chips.push({
        key: `${group.id}-${id}`,
        label: text,
        ariaLabel: text,
        onRemove: () => {
          const next = selectedIds.filter((item) => item !== id);
          if (group.id === "applications") {
            updateFilters({ applications: next });
            return;
          }
          if (group.id === "cultures") {
            updateFilters({ cultures: next });
            return;
          }
          if (group.id === "certifications") {
            updateFilters({ certifications: next });
            return;
          }
          if (group.id === "countriesOfOrigin") {
            updateFilters({ countriesOfOrigin: next });
            return;
          }
          updateFilters({
            customFilters: {
              ...(filters.customFilters ?? {}),
              [group.id]: next,
            },
          });
        },
      });
    }
  }

  if (filters.availabilityOnly) {
    chips.push({
      key: "available",
      label: t("inStockOnly"),
      ariaLabel: t("inStockOnly"),
      onRemove: () => updateFilters({ availabilityOnly: false }),
    });
  }

  if (filters.priceMin !== null) {
    const text = `${t("priceMin")}: ${filters.priceMin}`;
    chips.push({
      key: "price-min",
      label: text,
      ariaLabel: text,
      onRemove: () => updateFilters({ priceMin: null }),
    });
  }

  if (filters.priceMax !== null) {
    const text = `${t("priceMax")}: ${filters.priceMax}`;
    chips.push({
      key: "price-max",
      label: text,
      ariaLabel: text,
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
          aria-label={t("removeFilter", { label: chip.ariaLabel })}
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
