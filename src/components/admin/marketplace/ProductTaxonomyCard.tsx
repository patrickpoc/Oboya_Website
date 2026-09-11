"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PRODUCT_EDITOR_SELECT_CLASS } from "@/components/admin/marketplace/product-editor.constants";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { pickLocalizedLabel } from "@/lib/shop/localized-label";
import type { FilterOption, ShopBrand, ShopCategory, ShopFilterOptions } from "@/lib/shop/types";
import { cn } from "@/lib/utils";

const SELECT_CLASS = PRODUCT_EDITOR_SELECT_CLASS;

const MULTI_FILTER_GROUPS: Array<{
  key: keyof Pick<ShopFilterOptions, "applications" | "cultures" | "certifications">;
  accordionValue: string;
  labelKey: "application" | "cultures" | "certifications";
  productField: "application" | "cultures" | "certifications";
}> = [
  {
    key: "applications",
    accordionValue: "applications",
    labelKey: "application",
    productField: "application",
  },
  {
    key: "cultures",
    accordionValue: "cultures",
    labelKey: "cultures",
    productField: "cultures",
  },
  {
    key: "certifications",
    accordionValue: "certifications",
    labelKey: "certifications",
    productField: "certifications",
  },
];

function toggleInList(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

interface ProductTaxonomyCardProps {
  product: CmsProduct;
  categories: ShopCategory[];
  brands: ShopBrand[];
  filterOptions: ShopFilterOptions;
  loading?: boolean;
  onUpdate: (patch: Partial<CmsProduct>) => void;
}

export function ProductTaxonomyCard({
  product,
  categories,
  brands,
  filterOptions,
  loading = false,
  onUpdate,
}: ProductTaxonomyCardProps) {
  const t = useTranslations("admin.taxonomy");
  const { locale } = useAdminLocale();

  const labelFor = (option: Pick<FilterOption, "name" | "nameI18n">) =>
    pickLocalizedLabel(locale, option.name, option.nameI18n);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === product.categoryId),
    [categories, product.categoryId]
  );
  const selectedSubcategory = useMemo(
    () => selectedCategory?.subcategories.find((sub) => sub.id === product.subcategoryId),
    [selectedCategory, product.subcategoryId]
  );
  const selectedBrand = useMemo(
    () => brands.find((brand) => brand.id === product.brandId),
    [brands, product.brandId]
  );

  const discoverySummary = useMemo(() => {
    const chips: Array<{ id: string; label: string; group: string }> = [];

    for (const group of MULTI_FILTER_GROUPS) {
      const options = filterOptions[group.key];
      for (const optionId of product[group.productField]) {
        const option = options.find((item) => item.id === optionId);
        if (option) {
          chips.push({
            id: option.id,
            label: pickLocalizedLabel(locale, option.name, option.nameI18n),
            group: group.productField,
          });
        }
      }
    }

    if (product.countryOfOrigin) {
      const country = filterOptions.countriesOfOrigin.find(
        (item) => item.id === product.countryOfOrigin
      );
      if (country) {
        chips.push({
          id: country.id,
          label: pickLocalizedLabel(locale, country.name, country.nameI18n),
          group: "countryOfOrigin",
        });
      }
    }

    return chips;
  }, [filterOptions, locale, product]);

  const toggleMultiFilter = (
    field: "application" | "cultures" | "certifications",
    optionId: string
  ) => {
    onUpdate({ [field]: toggleInList(product[field], optionId) });
  };

  const clearMultiFilter = (field: "application" | "cultures" | "certifications") => {
    onUpdate({ [field]: [] });
  };

  const removeDiscoveryChip = (group: string, optionId: string) => {
    if (group === "countryOfOrigin") {
      onUpdate({ countryOfOrigin: "" });
      return;
    }
    toggleMultiFilter(group as "application" | "cultures" | "certifications", optionId);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {discoverySummary.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-1.5 rounded-md border border-dashed border-border/60 bg-muted/20 p-3"
            aria-live="polite"
          >
            <span className="mr-1 text-xs font-medium text-muted-foreground">
              {t("shopFilters")}
            </span>
            {discoverySummary.map((chip) => (
              <Badge key={`${chip.group}-${chip.id}`} variant="secondary" className="gap-1 pr-1">
                {chip.label}
                <button
                  type="button"
                  className="rounded-sm p-0.5 hover:bg-muted"
                  aria-label={t("removeChip", { label: chip.label })}
                  onClick={() => removeDiscoveryChip(chip.group, chip.id)}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <section aria-labelledby="classification-heading" className="space-y-4">
          <div>
            <h3 id="classification-heading" className="text-sm font-semibold text-oboya-blue-dark">
              {t("classification")}
            </h3>
            <p className="text-xs text-muted-foreground">{t("classificationHint")}</p>
          </div>

          <div className="space-y-4 rounded-lg bg-muted/30 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="product-category">{t("category")}</Label>
                <select
                  id="product-category"
                  value={product.categoryId}
                  onChange={(e) => {
                    const categoryId = e.target.value;
                    const category = categories.find((item) => item.id === categoryId);
                    onUpdate({
                      categoryId,
                      subcategoryId: category?.subcategories[0]?.id ?? "",
                    });
                  }}
                  className={SELECT_CLASS}
                  disabled={loading}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {labelFor(category)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-subcategory">{t("subcategory")}</Label>
                <select
                  id="product-subcategory"
                  value={product.subcategoryId}
                  onChange={(e) => onUpdate({ subcategoryId: e.target.value })}
                  className={SELECT_CLASS}
                  disabled={loading || !selectedCategory}
                  aria-describedby="subcategory-hint"
                >
                  {!selectedCategory ? (
                    <option value="">{t("selectCategoryFirst")}</option>
                  ) : (
                    selectedCategory.subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {labelFor(subcategory)}
                      </option>
                    ))
                  )}
                </select>
                <p id="subcategory-hint" className="text-xs text-muted-foreground">
                  {t("subcategoryHint")}
                </p>
              </div>
            </div>

            {selectedCategory && selectedSubcategory && (
              <p className="text-xs text-muted-foreground">
                {labelFor(selectedCategory)} › {labelFor(selectedSubcategory)}
              </p>
            )}

            <div className="space-y-1.5 sm:max-w-md">
              <Label htmlFor="product-brand">{t("brand")}</Label>
              <select
                id="product-brand"
                value={product.brandId}
                onChange={(e) => onUpdate({ brandId: e.target.value })}
                className={SELECT_CLASS}
                disabled={loading}
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {labelFor(brand)}
                  </option>
                ))}
              </select>
              {selectedBrand && (
                <p className="text-xs text-muted-foreground">
                  {t("manufacturer", { name: labelFor(selectedBrand) })}
                </p>
              )}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="shop-filters-heading"
          className="space-y-4 border-t border-border/60 pt-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 id="shop-filters-heading" className="text-sm font-semibold text-oboya-blue-dark">
                {t("shopFilterAttributes")}
              </h3>
              <p className="text-xs text-muted-foreground">{t("shopFilterHint")}</p>
            </div>
            <Link
              href="/admin/marketplace/filters"
              className="text-xs text-oboya-green underline-offset-2 hover:underline"
            >
              {t("manageOptions")}
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">{t("loadingOptions")}</p>
          ) : (
            <>
              <Accordion
                multiple
                defaultValue={["applications", "cultures"]}
                className="space-y-2"
              >
                {MULTI_FILTER_GROUPS.map((group) => {
                  const options = filterOptions[group.key];
                  const selectedIds = product[group.productField];
                  const selectedCount = selectedIds.length;
                  const groupLabel = t(group.labelKey);

                  return (
                    <AccordionItem
                      key={group.key}
                      value={group.accordionValue}
                      className="rounded-lg border border-border/60 px-4"
                    >
                      <AccordionTrigger className="py-3 hover:no-underline">
                        <span className="flex items-center gap-2">
                          {groupLabel}
                          {selectedCount > 0 && (
                            <Badge variant="secondary" className="text-[10px]">
                              {selectedCount}
                            </Badge>
                          )}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        {options.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            <Link
                              href="/admin/marketplace/filters"
                              className="text-oboya-green underline-offset-2 hover:underline"
                            >
                              {t("manageOptions")}
                            </Link>
                          </p>
                        ) : (
                          <fieldset className="space-y-3">
                            <legend className="sr-only">{groupLabel}</legend>

                            {selectedCount > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {selectedIds.map((optionId) => {
                                  const option = options.find((item) => item.id === optionId);
                                  if (!option) return null;
                                  return (
                                    <Badge
                                      key={optionId}
                                      variant="secondary"
                                      className="gap-1 pr-1"
                                    >
                                      {labelFor(option)}
                                      <button
                                        type="button"
                                        className="rounded-sm p-0.5 hover:bg-muted"
                                        aria-label={t("removeChip", {
                                          label: labelFor(option),
                                        })}
                                        onClick={() =>
                                          toggleMultiFilter(group.productField, optionId)
                                        }
                                      >
                                        <X className="size-3" />
                                      </button>
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}

                            <div className="grid gap-2 sm:grid-cols-2">
                              {options.map((option) => {
                                const checked = selectedIds.includes(option.id);
                                return (
                                  <label
                                    key={option.id}
                                    className={cn(
                                      "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                                      checked && "bg-oboya-green/5"
                                    )}
                                  >
                                    <input
                                      type="checkbox"
                                      className="size-4 rounded border-input"
                                      checked={checked}
                                      onChange={() =>
                                        toggleMultiFilter(group.productField, option.id)
                                      }
                                    />
                                    <span>{labelFor(option)}</span>
                                  </label>
                                );
                              })}
                            </div>

                            {selectedCount > 0 && (
                              <button
                                type="button"
                                className="text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => clearMultiFilter(group.productField)}
                              >
                                {t("clearAll")}
                              </button>
                            )}
                          </fieldset>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>

              <div className="space-y-1.5 sm:max-w-md">
                <Label htmlFor="country-of-manufacture">{t("countryOfOrigin")}</Label>
                <select
                  id="country-of-manufacture"
                  value={product.countryOfOrigin}
                  onChange={(e) => onUpdate({ countryOfOrigin: e.target.value })}
                  className={SELECT_CLASS}
                >
                  <option value="">{t("notSpecified")}</option>
                  {filterOptions.countriesOfOrigin.map((option) => (
                    <option key={option.id} value={option.id}>
                      {labelFor(option)}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
