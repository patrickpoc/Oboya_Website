"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PRODUCT_EDITOR_SELECT_CLASS } from "@/components/admin/marketplace/product-editor.constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";
import {
  brandOptions,
  categoryOptions,
  filterOptionLabels,
  marketOptions,
  subcategoryOptions,
} from "@/lib/cms/bulk-update/display-labels";
import { BULK_FIELD_LABELS } from "@/lib/cms/bulk-update/field-labels";
import type {
  BulkEditableField,
  BulkProductPatch,
  BulkUpdateCatalog,
} from "@/lib/cms/bulk-update/types";
import { cn } from "@/lib/utils";

type Props = {
  catalog: BulkUpdateCatalog;
  selectedCount: number;
  onApply: (patch: BulkProductPatch) => void;
};

const COLUMN_FIELDS: BulkEditableField[] = [
  "moq",
  "categoryId",
  "subcategoryId",
  "brandId",
  "application",
  "cultures",
  "certifications",
  "countryOfOrigin",
  "enabledCountries",
  "status",
];

type ActionRowState = {
  id: string;
  field: BulkEditableField;
  moq: string;
  categoryId: string;
  subcategoryId: string;
  brandId: string;
  application: string[];
  cultures: string[];
  certifications: string[];
  countryOfOrigin: string;
  markets: string[];
  shopOn: boolean;
};

function createRow(field: BulkEditableField = "categoryId"): ActionRowState {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    field,
    moq: "100",
    categoryId: "",
    subcategoryId: "",
    brandId: "",
    application: [],
    cultures: [],
    certifications: [],
    countryOfOrigin: "",
    markets: [],
    shopOn: true,
  };
}

function MultiOptionPicker({
  options,
  values,
  onChange,
  emptyLabel,
}: {
  options: Array<{ id: string; name: string }>;
  values: string[];
  onChange: (next: string[]) => void;
  emptyLabel?: string;
}) {
  const t = useTranslations("admin.products.bulk");
  const resolvedEmpty = emptyLabel ?? t("noOptionsInCatalog");
  return (
    <div className="max-h-28 min-w-[12rem] space-y-1 overflow-y-auto rounded-lg border border-input bg-background p-2 md:col-span-2">
      {options.length === 0 ? (
        <p className="text-xs font-normal text-muted-foreground">{resolvedEmpty}</p>
      ) : (
        options.map((option) => {
          const checked = values.includes(option.id);
          return (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-2 text-xs font-normal"
            >
              <input
                type="checkbox"
                className="size-3.5"
                checked={checked}
                onChange={() =>
                  onChange(
                    checked
                      ? values.filter((id) => id !== option.id)
                      : [...values, option.id]
                  )
                }
              />
              <span className="truncate">{option.name}</span>
            </label>
          );
        })
      )}
    </div>
  );
}

function buildPatchFromRow(
  row: ActionRowState,
  catalog: BulkUpdateCatalog
): BulkProductPatch | null {
  const patch: BulkProductPatch = {};
  switch (row.field) {
    case "moq": {
      const value = Number(row.moq);
      if (!Number.isFinite(value) || value < 1) return null;
      patch.moq = Math.floor(value);
      break;
    }
    case "categoryId": {
      if (!row.categoryId) return null;
      patch.categoryId = row.categoryId;
      const category = catalog.categories.find((item) => item.id === row.categoryId);
      patch.subcategoryId =
        row.subcategoryId || category?.subcategories[0]?.id || "";
      break;
    }
    case "subcategoryId":
      if (!row.subcategoryId) return null;
      patch.subcategoryId = row.subcategoryId;
      break;
    case "brandId":
      if (!row.brandId) return null;
      patch.brandId = row.brandId;
      break;
    case "application":
      patch.application = [...row.application];
      break;
    case "cultures":
      patch.cultures = [...row.cultures];
      break;
    case "certifications":
      patch.certifications = [...row.certifications];
      break;
    case "countryOfOrigin":
      if (!row.countryOfOrigin) return null;
      patch.countryOfOrigin = row.countryOfOrigin;
      break;
    case "enabledCountries": {
      const enabledCountries: Record<string, boolean> = {};
      for (const country of catalog.countries) {
        enabledCountries[country.code] = row.markets.includes(country.code);
      }
      patch.enabledCountries = enabledCountries;
      break;
    }
    case "status":
      patch.status = row.shopOn ? "published" : "draft";
      break;
    default:
      return null;
  }
  return patch;
}

export function BulkColumnActions({ catalog, selectedCount, onApply }: Props) {
  const t = useTranslations("admin.products.bulk");
  const [rows, setRows] = useState<ActionRowState[]>(() => [createRow()]);

  const usedFields = useMemo(() => new Set(rows.map((row) => row.field)), [rows]);
  const availableToAdd = COLUMN_FIELDS.filter((field) => !usedFields.has(field));

  const updateRow = (id: string, patch: Partial<ActionRowState>) => {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;
        if (patch.field && patch.field !== row.field) {
          const taken = current.some(
            (other) => other.id !== id && other.field === patch.field
          );
          if (taken) return row;
        }
        return { ...row, ...patch };
      })
    );
  };

  const addRow = () => {
    const nextField = availableToAdd[0];
    if (!nextField) return;
    setRows((current) => [...current, createRow(nextField)]);
  };

  const removeRow = (id: string) => {
    setRows((current) => (current.length <= 1 ? current : current.filter((row) => row.id !== id)));
  };

  const apply = () => {
    if (selectedCount === 0) return;
    let merged: BulkProductPatch = {};
    let applied = 0;
    for (const row of rows) {
      const patch = buildPatchFromRow(row, catalog);
      if (!patch) continue;
      merged = { ...merged, ...patch };
      applied += 1;
    }
    if (applied === 0) return;
    onApply(merged);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-oboya-blue-dark">{t("columnTitle")}</p>
          <p className="text-xs font-normal text-muted-foreground">
            {t("columnDescription", {
              count: selectedCount,
              plural: selectedCount === 1 ? "" : "s",
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={availableToAdd.length === 0}
            onClick={addRow}
            title={
              availableToAdd.length === 0
                ? t("allFieldsHaveRow")
                : t("addAnotherField")
            }
          >
            <Plus className="mr-1.5 size-4" />
            {t("addField")}
          </Button>
          <Button
            type="button"
            disabled={selectedCount === 0}
            onClick={apply}
            className="rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
          >
            {t("applyToSelected")}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row) => {
          const fieldOptions = COLUMN_FIELDS.filter(
            (field) => field === row.field || !usedFields.has(field)
          );
          return (
            <ActionRowEditor
              key={row.id}
              row={row}
              catalog={catalog}
              fieldOptions={fieldOptions}
              canRemove={rows.length > 1}
              onChange={(patch) => updateRow(row.id, patch)}
              onRemove={() => removeRow(row.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ActionRowEditor({
  row,
  catalog,
  fieldOptions,
  canRemove,
  onChange,
  onRemove,
}: {
  row: ActionRowState;
  catalog: BulkUpdateCatalog;
  fieldOptions: BulkEditableField[];
  canRemove: boolean;
  onChange: (patch: Partial<ActionRowState>) => void;
  onRemove: () => void;
}) {
  const { locale } = useAdminLocale();
  const t = useTranslations("admin.products.bulk");

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
      <div className="grid gap-2 md:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1.4fr)_auto] md:items-start">
        <select
          className={PRODUCT_EDITOR_SELECT_CLASS}
          value={row.field}
          onChange={(event) =>
            onChange({ field: event.target.value as BulkEditableField })
          }
        >
          {fieldOptions.map((item) => (
            <option key={item} value={item}>
              {BULK_FIELD_LABELS[item]}
            </option>
          ))}
        </select>

        <div className="grid gap-2 sm:grid-cols-2">
          {row.field === "moq" && (
            <Input
              type="number"
              min={1}
              value={row.moq}
              onChange={(event) => onChange({ moq: event.target.value })}
              placeholder={t("moq")}
            />
          )}

          {row.field === "categoryId" && (
            <>
              <select
                className={PRODUCT_EDITOR_SELECT_CLASS}
                value={row.categoryId}
                onChange={(event) => {
                  const next = event.target.value;
                  const category = catalog.categories.find((item) => item.id === next);
                  onChange({
                    categoryId: next,
                    subcategoryId: category?.subcategories[0]?.id ?? "",
                  });
                }}
              >
                <option value="">{t("selectCategory")}</option>
                {categoryOptions(catalog, locale).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                className={PRODUCT_EDITOR_SELECT_CLASS}
                value={row.subcategoryId}
                onChange={(event) => onChange({ subcategoryId: event.target.value })}
              >
                <option value="">{t("selectSubcategory")}</option>
                {subcategoryOptions(catalog, row.categoryId, locale).map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </>
          )}

          {row.field === "subcategoryId" && (
            <select
              className={cn(PRODUCT_EDITOR_SELECT_CLASS, "sm:col-span-2")}
              value={row.subcategoryId}
              onChange={(event) => onChange({ subcategoryId: event.target.value })}
            >
              <option value="">{t("selectSubcategory")}</option>
              {catalog.categories.flatMap((category) => {
                const categoryLabel =
                  categoryOptions(catalog, locale).find((item) => item.id === category.id)
                    ?.name ?? category.name;
                return subcategoryOptions(catalog, category.id, locale).map((subcategory) => (
                  <option key={`${category.id}-${subcategory.id}`} value={subcategory.id}>
                    {categoryLabel} / {subcategory.name}
                  </option>
                ));
              })}
            </select>
          )}

          {row.field === "brandId" && (
            <select
              className={cn(PRODUCT_EDITOR_SELECT_CLASS, "sm:col-span-2")}
              value={row.brandId}
              onChange={(event) => onChange({ brandId: event.target.value })}
            >
              <option value="">{t("selectBrand")}</option>
              {brandOptions(catalog, locale).map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          )}

          {row.field === "application" && (
            <MultiOptionPicker
              options={filterOptionLabels(catalog, "applications", locale)}
              values={row.application}
              onChange={(application) => onChange({ application })}
            />
          )}

          {row.field === "cultures" && (
            <MultiOptionPicker
              options={filterOptionLabels(catalog, "cultures", locale)}
              values={row.cultures}
              onChange={(cultures) => onChange({ cultures })}
            />
          )}

          {row.field === "certifications" && (
            <MultiOptionPicker
              options={filterOptionLabels(catalog, "certifications", locale)}
              values={row.certifications}
              onChange={(certifications) => onChange({ certifications })}
            />
          )}

          {row.field === "countryOfOrigin" && (
            <select
              className={cn(PRODUCT_EDITOR_SELECT_CLASS, "sm:col-span-2")}
              value={row.countryOfOrigin}
              onChange={(event) => onChange({ countryOfOrigin: event.target.value })}
            >
              <option value="">{t("selectCountry")}</option>
              {filterOptionLabels(catalog, "countriesOfOrigin", locale).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          )}

          {row.field === "enabledCountries" && (
            <MultiOptionPicker
              options={marketOptions(catalog)}
              values={row.markets}
              onChange={(markets) => onChange({ markets })}
              emptyLabel={t("noMarketsInCatalog")}
            />
          )}

          {row.field === "status" && (
            <label className="flex h-9 items-center gap-2 text-sm font-normal">
              <input
                type="checkbox"
                checked={row.shopOn}
                onChange={(event) => onChange({ shopOn: event.target.checked })}
              />
              {t("availableInShop")}
            </label>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 text-muted-foreground hover:text-oboya-orange"
          disabled={!canRemove}
          onClick={onRemove}
          aria-label={t("removeFieldRow")}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
