"use client";

import { useCallback, useRef } from "react";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { useOverlayA11y } from "@/hooks/use-overlay-a11y";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ShopLocalizedText } from "@/lib/shop/types";
import { BrandLabel } from "@/components/shop/BrandLabel";
import { pickLocalizedLabel } from "@/lib/shop/localized-label";

function toggleInList(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/50 py-4 last:border-b-0">
      <p className="mb-3 text-xs font-semibold tracking-wide text-oboya-blue-dark uppercase">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CheckboxRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: React.ReactNode;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-oboya-blue-dark"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 shrink-0 rounded border-border text-oboya-green focus:ring-oboya-green/30"
      />
      <span className="min-w-0">{label}</span>
    </label>
  );
}

export function FilterSidebar({ className }: { className?: string }) {
  const t = useTranslations("shop");
  const locale = useLocale();
  const {
    categories,
    brands,
    filterGroups,
    filterOptions,
    filters,
    updateFilters,
    clearFilters,
    activeFilterCount,
    currency,
  } = useShop();

  const selectedCategory = categories.find((c) => c.id === filters.categoryId);

  const getGroupSelectedIds = useCallback(
    (groupId: string) => {
      if (groupId === "applications") return filters.applications;
      if (groupId === "cultures") return filters.cultures;
      if (groupId === "certifications") return filters.certifications;
      if (groupId === "countriesOfOrigin") return filters.countriesOfOrigin;
      return filters.customFilters?.[groupId] ?? [];
    },
    [filters]
  );

  const toggleGroupOption = useCallback(
    (groupId: string, optionId: string) => {
      const current = getGroupSelectedIds(groupId);
      const next = toggleInList(current, optionId);
      if (groupId === "applications") {
        updateFilters({ applications: next });
        return;
      }
      if (groupId === "cultures") {
        updateFilters({ cultures: next });
        return;
      }
      if (groupId === "certifications") {
        updateFilters({ certifications: next });
        return;
      }
      if (groupId === "countriesOfOrigin") {
        updateFilters({ countriesOfOrigin: next });
        return;
      }
      updateFilters({
        customFilters: {
          ...(filters.customFilters ?? {}),
          [groupId]: next,
        },
      });
    },
    [filters.customFilters, getGroupSelectedIds, updateFilters]
  );

  return (
    <aside
      className={cn(
        "rounded-xl border border-border/60 bg-white p-4 shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-oboya-blue-dark">{t("filters")}</h2>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-oboya-green hover:underline"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>

      <FilterGroup title={t("filterCategories")}>
        <button
          type="button"
          onClick={() => updateFilters({ categoryId: null, subcategoryIds: [] })}
          className={cn(
            "block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
            !filters.categoryId
              ? "bg-oboya-green/10 font-medium text-oboya-blue-dark"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          {t("allCategories")}
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() =>
              updateFilters({
                categoryId: category.id,
                subcategoryIds: [],
              })
            }
            className={cn(
              "block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
              filters.categoryId === category.id
                ? "bg-oboya-green/10 font-medium text-oboya-blue-dark"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {pickLocalizedLabel(locale, category.name, category.nameI18n)}
          </button>
        ))}
      </FilterGroup>

      {selectedCategory && selectedCategory.subcategories.length > 0 && (
        <FilterGroup title={t("filterSubcategories")}>
          {selectedCategory.subcategories.map((sub) => (
            <CheckboxRow
              key={sub.id}
              id={`sub-${sub.id}`}
              label={pickLocalizedLabel(locale, sub.name, sub.nameI18n)}
              checked={filters.subcategoryIds.includes(sub.id)}
              onChange={() =>
                updateFilters({
                  subcategoryIds: toggleInList(filters.subcategoryIds, sub.id),
                })
              }
            />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title={t("filterBrands")}>
        {brands.map((brand) => (
          <CheckboxRow
            key={brand.id}
            id={`brand-${brand.id}`}
            label={<BrandLabel brand={brand} locale={locale} />}
            checked={filters.brandIds.includes(brand.id)}
            onChange={() =>
              updateFilters({
                brandIds: toggleInList(filters.brandIds, brand.id),
              })
            }
          />
        ))}
      </FilterGroup>

      {filterGroups.map((group) => {
        const options = filterOptions[group.id] ?? [];
        if (options.length === 0) return null;
        const selectedIds = getGroupSelectedIds(group.id);
        return (
          <FilterGroup
            key={group.id}
            title={pickLocalizedLabel(locale, group.name, group.nameI18n)}
          >
            {options.map((item) => (
              <CheckboxRow
                key={item.id}
                id={`filter-${group.id}-${item.id}`}
                label={pickLocalizedLabel(locale, item.name, item.nameI18n)}
                checked={selectedIds.includes(item.id)}
                onChange={() => toggleGroupOption(group.id, item.id)}
              />
            ))}
          </FilterGroup>
        );
      })}

      <FilterGroup title={t("filterAvailability")}>
        <CheckboxRow
          id="available-only"
          label={t("inStockOnly")}
          checked={filters.availabilityOnly}
          onChange={() =>
            updateFilters({ availabilityOnly: !filters.availabilityOnly })
          }
        />
      </FilterGroup>

      {currency && (
        <FilterGroup title={t("filterPriceRange")}>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label
                htmlFor="shop-price-min"
                className="text-[11px] font-medium text-muted-foreground"
              >
                {t("priceMin")}
              </label>
              <input
                id="shop-price-min"
                type="number"
                min={0}
                placeholder={t("priceMin")}
                value={filters.priceMin ?? ""}
                onChange={(event) =>
                  updateFilters({
                    priceMin: event.target.value
                      ? Number(event.target.value)
                      : null,
                  })
                }
                className="h-9 w-full rounded-lg border border-border px-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="shop-price-max"
                className="text-[11px] font-medium text-muted-foreground"
              >
                {t("priceMax")}
              </label>
              <input
                id="shop-price-max"
                type="number"
                min={0}
                placeholder={t("priceMax")}
                value={filters.priceMax ?? ""}
                onChange={(event) =>
                  updateFilters({
                    priceMax: event.target.value
                      ? Number(event.target.value)
                      : null,
                  })
                }
                className="h-9 w-full rounded-lg border border-border px-2 text-sm"
              />
            </div>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {currency}
          </p>
        </FilterGroup>
      )}
    </aside>
  );
}

export function FilterDrawer() {
  const t = useTranslations("shop");
  const { isFilterDrawerOpen, setFilterDrawerOpen } = useShop();
  const panelRef = useRef<HTMLDivElement>(null);
  const handleClose = useCallback(() => setFilterDrawerOpen(false), [setFilterDrawerOpen]);

  useOverlayA11y({
    open: isFilterDrawerOpen,
    onClose: handleClose,
    containerRef: panelRef,
  });

  if (!isFilterDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-oboya-blue-dark/40"
        onClick={handleClose}
        aria-label={t("closeFilters")}
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("filters")}
        className="absolute inset-y-0 left-0 flex w-full max-w-sm flex-col bg-white pt-[env(safe-area-inset-top)] shadow-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
          <h2 className="font-semibold text-oboya-blue-dark">{t("filters")}</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label={t("close")}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-white text-oboya-blue-dark shadow-sm"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <FilterSidebar className="border-0 p-0 shadow-none" />
        </div>
        <div className="shrink-0 border-t border-border/60 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleClose}
            className={buttonVariants({
              variant: "outline",
              className:
                "w-full rounded-full border-oboya-blue-dark/30 bg-white text-oboya-blue-dark hover:bg-oboya-soft-white hover:text-oboya-blue-dark",
            })}
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
