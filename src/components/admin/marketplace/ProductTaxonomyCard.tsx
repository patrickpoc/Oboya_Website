"use client";

import Link from "next/link";
import { useMemo } from "react";
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
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { FilterOption, ShopBrand, ShopCategory, ShopFilterOptions } from "@/lib/shop/types";
import { cn } from "@/lib/utils";

const SELECT_CLASS = PRODUCT_EDITOR_SELECT_CLASS;

const MULTI_FILTER_GROUPS: Array<{
  key: keyof Pick<ShopFilterOptions, "applications" | "cultures" | "certifications">;
  accordionValue: string;
  label: string;
  productField: "application" | "cultures" | "certifications";
}> = [
  { key: "applications", accordionValue: "applications", label: "Application", productField: "application" },
  { key: "cultures", accordionValue: "cultures", label: "Crop / culture", productField: "cultures" },
  {
    key: "certifications",
    accordionValue: "certifications",
    label: "Certifications",
    productField: "certifications",
  },
];

function toggleInList(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function pickAdminFilterLabel(option: FilterOption) {
  const fromEn = option.nameI18n?.en?.trim();
  if (fromEn) return fromEn;
  return option.name;
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
            label: pickAdminFilterLabel(option),
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
          label: pickAdminFilterLabel(country),
          group: "countryOfOrigin",
        });
      }
    }

    return chips;
  }, [filterOptions, product]);

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
        <CardTitle>Filters & classification</CardTitle>
        <CardDescription>
          Category, brand and shop filter attributes.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {discoverySummary.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-1.5 rounded-md border border-dashed border-border/60 bg-muted/20 p-3"
            aria-live="polite"
          >
            <span className="mr-1 text-xs font-medium text-muted-foreground">Shop filters:</span>
            {discoverySummary.map((chip) => (
              <Badge key={`${chip.group}-${chip.id}`} variant="secondary" className="gap-1 pr-1">
                {chip.label}
                <button
                  type="button"
                  className="rounded-sm p-0.5 hover:bg-muted"
                  aria-label={`Remove ${chip.label}`}
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
              Classification
            </h3>
            <p className="text-xs text-muted-foreground">
              Where this product belongs in the catalog.
            </p>
          </div>

          <div className="space-y-4 rounded-lg bg-muted/30 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="product-category">Category</Label>
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
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-subcategory">Subcategory</Label>
                <select
                  id="product-subcategory"
                  value={product.subcategoryId}
                  onChange={(e) => onUpdate({ subcategoryId: e.target.value })}
                  className={SELECT_CLASS}
                  disabled={loading || !selectedCategory}
                  aria-describedby="subcategory-hint"
                >
                  {!selectedCategory ? (
                    <option value="">Select a category first</option>
                  ) : (
                    selectedCategory.subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))
                  )}
                </select>
                <p id="subcategory-hint" className="text-xs text-muted-foreground">
                  Options depend on the selected category.
                </p>
              </div>
            </div>

            {selectedCategory && selectedSubcategory && (
              <p className="text-xs text-muted-foreground">
                {selectedCategory.name} › {selectedSubcategory.name}
              </p>
            )}

            <div className="space-y-1.5 sm:max-w-md">
              <Label htmlFor="product-brand">Brand</Label>
              <select
                id="product-brand"
                value={product.brandId}
                onChange={(e) => onUpdate({ brandId: e.target.value })}
                className={SELECT_CLASS}
                disabled={loading}
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {selectedBrand && (
                <p className="text-xs text-muted-foreground">Manufacturer: {selectedBrand.name}</p>
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
                Shop filter attributes
              </h3>
              <p className="text-xs text-muted-foreground">
                Shown to buyers in the catalog filter sidebar.
              </p>
            </div>
            <Link
              href="/admin/marketplace/filters"
              className="text-xs text-oboya-green underline-offset-2 hover:underline"
            >
              Manage options
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading filter options…</p>
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

                  return (
                    <AccordionItem
                      key={group.key}
                      value={group.accordionValue}
                      className="rounded-lg border border-border/60 px-4"
                    >
                      <AccordionTrigger className="py-3 hover:no-underline">
                        <span className="flex items-center gap-2">
                          {group.label}
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
                            No options configured.{" "}
                            <Link
                              href="/admin/marketplace/filters"
                              className="text-oboya-green underline-offset-2 hover:underline"
                            >
                              Add them in Filters
                            </Link>
                            .
                          </p>
                        ) : (
                          <fieldset className="space-y-3">
                            <legend className="sr-only">{group.label}</legend>

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
                                      {pickAdminFilterLabel(option)}
                                      <button
                                        type="button"
                                        className="rounded-sm p-0.5 hover:bg-muted"
                                        aria-label={`Remove ${pickAdminFilterLabel(option)}`}
                                        onClick={() => toggleMultiFilter(group.productField, optionId)}
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
                                    <span>{pickAdminFilterLabel(option)}</span>
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
                                Clear all
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
                <Label htmlFor="country-of-manufacture">Country of manufacture</Label>
                <select
                  id="country-of-manufacture"
                  value={product.countryOfOrigin}
                  onChange={(e) => onUpdate({ countryOfOrigin: e.target.value })}
                  className={SELECT_CLASS}
                >
                  <option value="">Not specified</option>
                  {filterOptions.countriesOfOrigin.map((option) => (
                    <option key={option.id} value={option.id}>
                      {pickAdminFilterLabel(option)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Single value shown in the shop origin filter.
                </p>
              </div>
            </>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
