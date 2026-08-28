"use client";

import { useCallback, useRef } from "react";
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
    filterOptions,
    filters,
    updateFilters,
    clearFilters,
    activeFilterCount,
    currency,
  } = useShop();

  const selectedCategory = categories.find((c) => c.id === filters.categoryId);

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

      <FilterGroup title={t("filterApplication")}>
        {filterOptions.applications.map((item) => (
          <CheckboxRow
            key={item.id}
            id={`app-${item.id}`}
            label={pickLocalizedLabel(locale, item.name, item.nameI18n)}
            checked={filters.applications.includes(item.id)}
            onChange={() =>
              updateFilters({
                applications: toggleInList(filters.applications, item.id),
              })
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup title={t("filterCulture")}>
        {filterOptions.cultures.map((item) => (
          <CheckboxRow
            key={item.id}
            id={`culture-${item.id}`}
            label={pickLocalizedLabel(locale, item.name, item.nameI18n)}
            checked={filters.cultures.includes(item.id)}
            onChange={() =>
              updateFilters({
                cultures: toggleInList(filters.cultures, item.id),
              })
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup title={t("filterCertifications")}>
        {filterOptions.certifications.map((item) => (
          <CheckboxRow
            key={item.id}
            id={`cert-${item.id}`}
            label={pickLocalizedLabel(locale, item.name, item.nameI18n)}
            checked={filters.certifications.includes(item.id)}
            onChange={() =>
              updateFilters({
                certifications: toggleInList(filters.certifications, item.id),
              })
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup title={t("filterOrigin")}>
        {filterOptions.countriesOfOrigin.map((item) => (
          <CheckboxRow
            key={item.id}
            id={`origin-${item.id}`}
            label={pickLocalizedLabel(locale, item.name, item.nameI18n)}
            checked={filters.countriesOfOrigin.includes(item.id)}
            onChange={() =>
              updateFilters({
                countriesOfOrigin: toggleInList(
                  filters.countriesOfOrigin,
                  item.id
                ),
              })
            }
          />
        ))}
      </FilterGroup>

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
    <div className="fixed inset-0 z-50 lg:hidden">
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
        className="absolute inset-y-0 left-0 w-full max-w-sm overflow-y-auto bg-white p-4 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-oboya-blue-dark">{t("filters")}</h2>
          <button
            type="button"
            onClick={handleClose}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {t("close")}
          </button>
        </div>
        <FilterSidebar className="border-0 p-0 shadow-none" />
      </div>
    </div>
  );
}
