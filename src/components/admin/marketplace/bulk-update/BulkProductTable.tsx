"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { PRODUCT_EDITOR_SELECT_CLASS } from "@/components/admin/marketplace/product-editor.constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  brandOptions,
  categoryOptions,
  filterOptionLabels,
  formatFieldDisplayValue,
  marketOptions,
  resolveCatalogDisplayName,
  subcategoryOptions,
  withCurrentLabeledOption,
  withCurrentLabeledOptions,
} from "@/lib/cms/bulk-update/display-labels";
import { BULK_FIELD_LABELS } from "@/lib/cms/bulk-update/field-labels";
import { displayProductName } from "@/lib/cms/bulk-update/search-products";
import { issuesForProduct } from "@/lib/cms/bulk-update/validate";
import type {
  BulkEditableField,
  BulkProductPatch,
  BulkUpdateCatalog,
  BulkValidationIssue,
  BulkWorkspaceRow,
} from "@/lib/cms/bulk-update/types";
import { cn } from "@/lib/utils";

type Props = {
  rows: BulkWorkspaceRow[];
  catalog: BulkUpdateCatalog;
  issues: BulkValidationIssue[];
  selectedIds: Set<string>;
  focusRowId?: string | null;
  preferredLocale?: string;
  onToggleSelect: (productId: string) => void;
  onToggleSelectAll: () => void;
  onRemove: (productId: string) => void;
  onPatch: (
    productId: string,
    patch: BulkProductPatch,
    variantId?: string | null
  ) => void;
};

/** @deprecated Import from `@/lib/cms/bulk-update/types` instead. */
export { BULK_UPDATE_MAX_PRODUCTS } from "@/lib/cms/bulk-update/types";

const TH =
  "whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-oboya-blue-dark/70";
const TD = "border-b border-border/40 px-3 py-3 align-middle";
const CONTROL = "h-9 text-sm";
const STICKY_LEFT_CHECK =
  "sticky left-0 z-30 w-10 min-w-10 bg-oboya-soft-white";
const STICKY_LEFT_PRODUCT =
  "sticky left-10 z-30 min-w-[15rem] border-r border-border/70 bg-oboya-soft-white shadow-[6px_0_10px_-6px_rgba(1,32,63,0.14)]";
const STICKY_LEFT_CHECK_BODY =
  "sticky left-0 z-20 w-10 min-w-10 bg-white";
const STICKY_LEFT_PRODUCT_BODY =
  "sticky left-10 z-20 min-w-[15rem] border-r border-border/70 bg-white shadow-[6px_0_10px_-6px_rgba(1,32,63,0.14)]";
const STICKY_RIGHT_HEAD =
  "sticky right-0 z-30 w-12 bg-oboya-soft-white text-center shadow-[-6px_0_8px_-6px_rgba(1,32,63,0.12)]";
const STICKY_RIGHT_BODY =
  "sticky right-0 z-20 w-12 bg-white shadow-[-6px_0_8px_-6px_rgba(1,32,63,0.12)]";

function CellShell({
  field,
  row,
  catalog,
  locale,
  issues,
  children,
}: {
  field: BulkEditableField;
  row: BulkWorkspaceRow;
  catalog: BulkUpdateCatalog;
  locale: string;
  issues: BulkValidationIssue[];
  children: ReactNode;
}) {
  const changed = row.changedFields.includes(field);
  const fieldIssues = issuesForProduct(issues, row.productId, field);
  const blocked = fieldIssues.some((issue) => issue.status === "blocked");
  const warning = fieldIssues.some((issue) => issue.status === "warning");
  const original = formatFieldDisplayValue(
    field,
    row.original,
    catalog,
    locale,
    row.variantId
  );
  const pending = formatFieldDisplayValue(
    field,
    row.pending,
    catalog,
    locale,
    row.variantId
  );

  return (
    <div
      className={cn(
        "min-w-[9rem] space-y-1 rounded-md p-1",
        blocked && "bg-red-50 ring-1 ring-red-200",
        !blocked && warning && "bg-amber-50 ring-1 ring-amber-200",
        !blocked && !warning && changed && "bg-emerald-50 ring-1 ring-emerald-200"
      )}
    >
      {children}
      {changed && (
        <p className="text-[10px] font-normal leading-tight text-emerald-700">
          <span className="text-muted-foreground">{original || "—"}</span>
          {" → "}
          <span className="font-medium">{pending || "—"}</span>
        </p>
      )}
      {blocked && (
        <p className="text-[10px] font-normal leading-tight text-red-700">
          {fieldIssues.find((i) => i.status === "blocked")?.message}
        </p>
      )}
      {!blocked && warning && (
        <p className="text-[10px] font-normal leading-tight text-amber-700">
          {fieldIssues.find((i) => i.status === "warning")?.message}
        </p>
      )}
    </div>
  );
}

function MultiSelectCell({
  options,
  values,
  onChange,
  disabled,
}: {
  options: Array<{ id: string; name: string }>;
  values: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("admin.products.bulk");
  return (
    <div
      className={cn(
        "max-h-28 min-w-[9rem] space-y-1 overflow-y-auto rounded-lg border border-input bg-background p-1.5",
        disabled && "pointer-events-none opacity-40"
      )}
    >
      {options.length === 0 ? (
        <p className="px-1 text-[11px] font-normal text-muted-foreground">{t("noOptions")}</p>
      ) : (
        options.map((option) => {
          const checked = values.includes(option.id);
          return (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-1.5 text-[11px] font-normal leading-snug"
            >
              <input
                type="checkbox"
                className="size-3.5 shrink-0"
                checked={checked}
                disabled={disabled}
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

function DimmedDash() {
  return <span className="text-xs text-muted-foreground/50">—</span>;
}

export function BulkProductTable({
  rows,
  catalog,
  issues,
  selectedIds,
  focusRowId,
  preferredLocale = "en",
  onToggleSelect,
  onToggleSelectAll,
  onRemove,
  onPatch,
}: Props) {
  const t = useTranslations("admin.products.bulk");
  const tCommon = useTranslations("admin.common");
  const locale = preferredLocale;
  const productIds = Array.from(new Set(rows.map((row) => row.productId)));
  const allSelected =
    productIds.length > 0 && productIds.every((id) => selectedIds.has(id));
  const focusRef = useRef<HTMLTableRowElement | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());

  const childCountByProduct = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      if (row.kind !== "variant") continue;
      counts.set(row.productId, (counts.get(row.productId) ?? 0) + 1);
    }
    return counts;
  }, [rows]);

  const visibleRows = useMemo(
    () =>
      rows.filter(
        (row) => row.kind === "parent" || !collapsedIds.has(row.productId)
      ),
    [rows, collapsedIds]
  );

  useEffect(() => {
    if (!focusRowId || !focusRef.current) return;
    focusRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [focusRowId]);

  useEffect(() => {
    if (!focusRowId) return;
    const focused = rows.find((row) => row.rowId === focusRowId);
    if (!focused || focused.kind !== "variant") return;
    setCollapsedIds((prev) => {
      if (!prev.has(focused.productId)) return prev;
      const next = new Set(prev);
      next.delete(focused.productId);
      return next;
    });
  }, [focusRowId, rows]);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-white p-8 text-center text-sm font-normal text-muted-foreground">
        {t("emptyWorkspace")}
      </div>
    );
  }

  const parentSkuByProduct = new Map(
    rows
      .filter((row) => row.kind === "parent")
      .map((row) => [row.productId, row.pending.sku] as const)
  );

  function toggleCollapsed(productId: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  return (
    <div className="rounded-xl border border-border/60 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[1900px] w-full border-separate border-spacing-0 text-left text-sm">
          <thead className="bg-oboya-soft-white">
            <tr>
              <th className={cn(TH, STICKY_LEFT_CHECK, "border-b border-border/60")}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  aria-label={t("selectAll")}
                  className="align-middle"
                />
              </th>
              <th className={cn(TH, STICKY_LEFT_PRODUCT, "border-b border-border/60")}>
                Product
              </th>
              <th className={cn(TH, "border-b border-border/60")}>{t("sku")}</th>
              <th className={cn(TH, "border-b border-border/60")}>{BULK_FIELD_LABELS.moq}</th>
              <th className={cn(TH, "border-b border-border/60")}>
                {BULK_FIELD_LABELS.categoryId}
              </th>
              <th className={cn(TH, "border-b border-border/60")}>
                {BULK_FIELD_LABELS.subcategoryId}
              </th>
              <th className={cn(TH, "border-b border-border/60")}>
                {BULK_FIELD_LABELS.brandId}
              </th>
              <th className={cn(TH, "border-b border-border/60")}>
                {BULK_FIELD_LABELS.application}
              </th>
              <th className={cn(TH, "border-b border-border/60")}>
                {BULK_FIELD_LABELS.cultures}
              </th>
              <th className={cn(TH, "border-b border-border/60")}>
                {BULK_FIELD_LABELS.certifications}
              </th>
              <th className={cn(TH, "border-b border-border/60")}>
                {BULK_FIELD_LABELS.countryOfOrigin}
              </th>
              <th className={cn(TH, "border-b border-border/60")}>
                {BULK_FIELD_LABELS.enabledCountries}
              </th>
              <th className={cn(TH, "border-b border-border/60")}>
                {BULK_FIELD_LABELS.status}
              </th>
              <th className={cn(TH, "border-b border-border/60")}>USD</th>
              <th className={cn(TH, "border-b border-border/60")}>BRL</th>
              <th className={cn(TH, "border-b border-border/60")}>EUR</th>
              <th
                className={cn(TH, STICKY_RIGHT_HEAD, "border-b border-border/60")}
                aria-label={tCommon("remove")}
              />
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const product = row.pending;
              const isParent = row.kind === "parent";
              const variant = !isParent
                ? (product.colorVariants ?? []).find((item) => item.id === row.variantId)
                : null;
              const image = isParent
                ? product.images[0]
                : variant?.image || product.images[0];
              const markets = product.enabledCountries ?? product.availability ?? {};
              const enabledMarketCodes = Object.entries(markets)
                .filter(([, enabled]) => enabled)
                .map(([code]) => code);
              const parentSku = parentSkuByProduct.get(row.productId) || product.sku;
              const isFocused = focusRowId === row.rowId;
              const childCount = childCountByProduct.get(row.productId) ?? 0;
              const hasChildren = isParent && childCount > 0;
              const isCollapsed = collapsedIds.has(row.productId);

              return (
                <tr
                  key={row.rowId}
                  ref={isFocused ? focusRef : undefined}
                  className={cn(
                    !isParent && "bg-oboya-soft-white/40",
                    isFocused && "ring-2 ring-inset ring-oboya-blue-light"
                  )}
                >
                  <td className={cn(TD, STICKY_LEFT_CHECK_BODY, !isParent && "bg-oboya-soft-white/40")}>
                    {isParent ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.productId)}
                        onChange={() => onToggleSelect(row.productId)}
                        aria-label={t("selectProduct", { sku: product.sku })}
                        className="align-middle"
                      />
                    ) : (
                      <span className="block w-3" aria-hidden />
                    )}
                  </td>
                  <td
                    className={cn(
                      TD,
                      STICKY_LEFT_PRODUCT_BODY,
                      !isParent && "bg-oboya-soft-white/40"
                    )}
                  >
                    <div
                      className={cn(
                        "flex min-w-[15rem] items-center gap-2 pr-1",
                        !isParent && "pl-4"
                      )}
                    >
                      {hasChildren ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-oboya-blue-dark/70 hover:bg-oboya-blue/10 hover:text-oboya-blue"
                          onClick={() => toggleCollapsed(row.productId)}
                          aria-expanded={!isCollapsed}
                          aria-label={
                            isCollapsed
                              ? t("expandColors", { count: childCount })
                              : t("collapseColors", { count: childCount })
                          }
                        >
                          {isCollapsed ? (
                            <ChevronRight className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </Button>
                      ) : (
                        <span className="size-7 shrink-0" aria-hidden />
                      )}
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/50">
                        {image ? (
                          <Image
                            src={image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm font-medium leading-snug text-oboya-blue-dark">
                          {isParent
                            ? displayProductName(product, preferredLocale)
                            : variant?.nameI18n?.en ||
                              variant?.name ||
                              row.matchedSku}
                        </span>
                        {isParent && hasChildren ? (
                          <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                            {isCollapsed
                              ? t("colorsCollapsed", { count: childCount })
                              : t("colorsExpanded", { count: childCount })}
                          </span>
                        ) : null}
                        {!isParent && (
                          <span className="mt-0.5 inline-flex rounded bg-oboya-blue/10 px-1.5 py-0.5 text-[10px] font-medium text-oboya-blue">
                            {t("colorOfParent", { parentSku })}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={cn(TD, "font-mono text-xs font-normal text-oboya-blue-dark/80")}>
                    {isParent ? product.sku : variant?.sku || row.matchedSku}
                  </td>
                  <td className={TD}>
                    {isParent ? (
                      <CellShell
                        field="moq"
                        row={row}
                        catalog={catalog}
                        locale={locale}
                        issues={issues}
                      >
                        <Input
                          type="number"
                          min={1}
                          className={CONTROL}
                          value={product.moq}
                          onChange={(event) =>
                            onPatch(row.productId, {
                              moq: Number(event.target.value) || 0,
                            })
                          }
                        />
                      </CellShell>
                    ) : (
                      <CellShell
                        field="variantMoq"
                        row={row}
                        catalog={catalog}
                        locale={locale}
                        issues={issues}
                      >
                        <Input
                          type="number"
                          min={1}
                          className={CONTROL}
                          value={variant?.moq ?? 1}
                          onChange={(event) =>
                            onPatch(
                              row.productId,
                              {
                                variantMoq: Number(event.target.value) || 0,
                              },
                              row.variantId
                            )
                          }
                        />
                      </CellShell>
                    )}
                  </td>
                  <td className={TD}>
                    {isParent ? (
                      <CellShell
                        field="categoryId"
                        row={row}
                        catalog={catalog}
                        locale={locale}
                        issues={issues}
                      >
                        <select
                          className={cn(PRODUCT_EDITOR_SELECT_CLASS, CONTROL)}
                          value={product.categoryId || ""}
                          onChange={(event) => {
                            const nextCategoryId = event.target.value;
                            const nextCategory = catalog.categories.find(
                              (item) => item.id === nextCategoryId
                            );
                            onPatch(row.productId, {
                              categoryId: nextCategoryId,
                              subcategoryId: nextCategory?.subcategories[0]?.id ?? "",
                            });
                          }}
                        >
                          <option value="">—</option>
                          {withCurrentLabeledOption(
                            categoryOptions(catalog, locale),
                            product.categoryId,
                            (id) =>
                              resolveCatalogDisplayName(catalog, "category", id, locale)
                          ).map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </CellShell>
                    ) : (
                      <DimmedDash />
                    )}
                  </td>
                  <td className={TD}>
                    {isParent ? (
                      <CellShell
                        field="subcategoryId"
                        row={row}
                        catalog={catalog}
                        locale={locale}
                        issues={issues}
                      >
                        <select
                          className={cn(PRODUCT_EDITOR_SELECT_CLASS, CONTROL)}
                          value={product.subcategoryId || ""}
                          onChange={(event) =>
                            onPatch(row.productId, {
                              subcategoryId: event.target.value,
                            })
                          }
                        >
                          <option value="">—</option>
                          {withCurrentLabeledOption(
                            subcategoryOptions(catalog, product.categoryId, locale),
                            product.subcategoryId,
                            (id) =>
                              resolveCatalogDisplayName(catalog, "subcategory", id, locale)
                          ).map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </CellShell>
                    ) : (
                      <DimmedDash />
                    )}
                  </td>
                  <td className={TD}>
                    {isParent ? (
                      <CellShell
                        field="brandId"
                        row={row}
                        catalog={catalog}
                        locale={locale}
                        issues={issues}
                      >
                        <select
                          className={cn(PRODUCT_EDITOR_SELECT_CLASS, CONTROL)}
                          value={product.brandId || ""}
                          onChange={(event) =>
                            onPatch(row.productId, { brandId: event.target.value })
                          }
                        >
                          <option value="">—</option>
                          {withCurrentLabeledOption(
                            brandOptions(catalog, locale),
                            product.brandId,
                            (id) => resolveCatalogDisplayName(catalog, "brand", id, locale)
                          ).map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </CellShell>
                    ) : (
                      <DimmedDash />
                    )}
                  </td>
                  <td className={TD}>
                    {isParent ? (
                      <CellShell
                        field="application"
                        row={row}
                        catalog={catalog}
                        locale={locale}
                        issues={issues}
                      >
                        <MultiSelectCell
                          options={withCurrentLabeledOptions(
                            filterOptionLabels(catalog, "applications", locale),
                            product.application,
                            (id) =>
                              resolveCatalogDisplayName(catalog, "application", id, locale)
                          )}
                          values={product.application ?? []}
                          onChange={(application) =>
                            onPatch(row.productId, { application })
                          }
                        />
                      </CellShell>
                    ) : (
                      <DimmedDash />
                    )}
                  </td>
                  <td className={TD}>
                    {isParent ? (
                      <CellShell
                        field="cultures"
                        row={row}
                        catalog={catalog}
                        locale={locale}
                        issues={issues}
                      >
                        <MultiSelectCell
                          options={withCurrentLabeledOptions(
                            filterOptionLabels(catalog, "cultures", locale),
                            product.cultures,
                            (id) =>
                              resolveCatalogDisplayName(catalog, "cultures", id, locale)
                          )}
                          values={product.cultures ?? []}
                          onChange={(cultures) => onPatch(row.productId, { cultures })}
                        />
                      </CellShell>
                    ) : (
                      <DimmedDash />
                    )}
                  </td>
                  <td className={TD}>
                    {isParent ? (
                      <CellShell
                        field="certifications"
                        row={row}
                        catalog={catalog}
                        locale={locale}
                        issues={issues}
                      >
                        <MultiSelectCell
                          options={withCurrentLabeledOptions(
                            filterOptionLabels(catalog, "certifications", locale),
                            product.certifications,
                            (id) =>
                              resolveCatalogDisplayName(
                                catalog,
                                "certifications",
                                id,
                                locale
                              )
                          )}
                          values={product.certifications ?? []}
                          onChange={(certifications) =>
                            onPatch(row.productId, { certifications })
                          }
                        />
                      </CellShell>
                    ) : (
                      <DimmedDash />
                    )}
                  </td>
                  <td className={TD}>
                    {isParent ? (
                      <CellShell
                        field="countryOfOrigin"
                        row={row}
                        catalog={catalog}
                        locale={locale}
                        issues={issues}
                      >
                        <select
                          className={cn(PRODUCT_EDITOR_SELECT_CLASS, CONTROL)}
                          value={product.countryOfOrigin || ""}
                          onChange={(event) =>
                            onPatch(row.productId, {
                              countryOfOrigin: event.target.value,
                            })
                          }
                        >
                          <option value="">—</option>
                          {withCurrentLabeledOption(
                            filterOptionLabels(catalog, "countriesOfOrigin", locale),
                            product.countryOfOrigin,
                            (id) =>
                              resolveCatalogDisplayName(
                                catalog,
                                "countryOfOrigin",
                                id,
                                locale
                              )
                          ).map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </CellShell>
                    ) : (
                      <DimmedDash />
                    )}
                  </td>
                  <td className={TD}>
                    {isParent ? (
                      <CellShell
                        field="enabledCountries"
                        row={row}
                        catalog={catalog}
                        locale={locale}
                        issues={issues}
                      >
                        <MultiSelectCell
                          options={withCurrentLabeledOptions(
                            marketOptions(catalog),
                            enabledMarketCodes,
                            (id) =>
                              resolveCatalogDisplayName(catalog, "market", id, locale)
                          )}
                          values={enabledMarketCodes}
                          onChange={(codes) => {
                            const enabledCountries: Record<string, boolean> = {};
                            const codesSet = new Set(codes);
                            for (const country of catalog.countries) {
                              enabledCountries[country.code] = codesSet.has(country.code);
                            }
                            for (const code of codes) {
                              if (!(code in enabledCountries)) {
                                enabledCountries[code] = true;
                              }
                            }
                            onPatch(row.productId, { enabledCountries });
                          }}
                        />
                      </CellShell>
                    ) : (
                      <DimmedDash />
                    )}
                  </td>
                  <td className={TD}>
                    {isParent ? (
                      <CellShell
                        field="status"
                        row={row}
                        catalog={catalog}
                        locale={locale}
                        issues={issues}
                      >
                        <label className="flex h-9 items-center gap-2 text-sm font-normal">
                          <input
                            type="checkbox"
                            checked={product.status === "published"}
                            onChange={(event) =>
                              onPatch(row.productId, {
                                status: event.target.checked ? "published" : "draft",
                              })
                            }
                          />
                          Shop
                        </label>
                      </CellShell>
                    ) : (
                      <DimmedDash />
                    )}
                  </td>
                  <td className={TD}>
                    {isParent ? (
                      <Input
                        type="number"
                        min={0}
                        className={CONTROL}
                        value={product.prices?.USD ?? ""}
                        onChange={(event) =>
                          onPatch(row.productId, {
                            priceUsd:
                              event.target.value === ""
                                ? null
                                : Number(event.target.value),
                          })
                        }
                      />
                    ) : (
                      <Input
                        type="number"
                        min={0}
                        className={CONTROL}
                        value={variant?.prices?.USD ?? ""}
                        placeholder={String(product.prices?.USD ?? "")}
                        onChange={(event) =>
                          onPatch(
                            row.productId,
                            {
                              variantPriceUsd:
                                event.target.value === ""
                                  ? null
                                  : Number(event.target.value),
                            },
                            row.variantId
                          )
                        }
                      />
                    )}
                  </td>
                  <td className={TD}>
                    {isParent ? (
                      <Input
                        type="number"
                        min={0}
                        className={CONTROL}
                        value={product.prices?.BRL ?? ""}
                        onChange={(event) =>
                          onPatch(row.productId, {
                            priceBrl:
                              event.target.value === ""
                                ? null
                                : Number(event.target.value),
                          })
                        }
                      />
                    ) : (
                      <Input
                        type="number"
                        min={0}
                        className={CONTROL}
                        value={variant?.prices?.BRL ?? ""}
                        placeholder={String(product.prices?.BRL ?? "")}
                        onChange={(event) =>
                          onPatch(
                            row.productId,
                            {
                              variantPriceBrl:
                                event.target.value === ""
                                  ? null
                                  : Number(event.target.value),
                            },
                            row.variantId
                          )
                        }
                      />
                    )}
                  </td>
                  <td className={TD}>
                    {isParent ? (
                      <Input
                        type="number"
                        min={0}
                        className={CONTROL}
                        value={product.prices?.EUR ?? ""}
                        onChange={(event) =>
                          onPatch(row.productId, {
                            priceEur:
                              event.target.value === ""
                                ? null
                                : Number(event.target.value),
                          })
                        }
                      />
                    ) : (
                      <Input
                        type="number"
                        min={0}
                        className={CONTROL}
                        value={variant?.prices?.EUR ?? ""}
                        placeholder={String(product.prices?.EUR ?? "")}
                        onChange={(event) =>
                          onPatch(
                            row.productId,
                            {
                              variantPriceEur:
                                event.target.value === ""
                                  ? null
                                  : Number(event.target.value),
                            },
                            row.variantId
                          )
                        }
                      />
                    )}
                  </td>
                  <td className={cn(TD, STICKY_RIGHT_BODY, !isParent && "bg-oboya-soft-white/40")}>
                    {isParent ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:bg-oboya-orange/10 hover:text-oboya-orange"
                        onClick={() => onRemove(row.productId)}
                        aria-label={t("removeProduct", { sku: product.sku })}
                      >
                        <X className="size-4" />
                      </Button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
