"use client";

import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { PRODUCT_EDITOR_SELECT_CLASS } from "@/components/admin/marketplace/product-editor.constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  brandOptions,
  categoryOptions,
  subcategoryOptions,
} from "@/lib/cms/bulk-update/display-labels";
import { issuesForImportProduct } from "@/lib/cms/bulk-import/validate";
import type {
  ImportCatalog,
  ImportEditableField,
  ImportProductPatch,
  ImportValidationIssue,
  ImportWorkspaceRow,
} from "@/lib/cms/bulk-import/types";
import type { CmsStatus } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

type Props = {
  rows: ImportWorkspaceRow[];
  issues: ImportValidationIssue[];
  catalog: ImportCatalog;
  preferredLocale?: string;
  onPatch: (productId: string, patch: ImportProductPatch) => void;
  onRemove: (productId: string) => void;
};

const TH =
  "whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-oboya-blue-dark/70";
const TD = "border-b border-border/40 px-3 py-3 align-middle";
const CONTROL = "h-9 text-sm";
const STICKY_LEFT_PRODUCT =
  "sticky left-0 z-30 min-w-[14rem] border-r border-border/70 bg-oboya-soft-white shadow-[6px_0_10px_-6px_rgba(1,32,63,0.14)]";
const STICKY_LEFT_PRODUCT_BODY =
  "sticky left-0 z-20 min-w-[14rem] border-r border-border/70 bg-white shadow-[6px_0_10px_-6px_rgba(1,32,63,0.14)]";
const STICKY_RIGHT_HEAD =
  "sticky right-0 z-30 w-12 bg-oboya-soft-white text-center shadow-[-6px_0_8px_-6px_rgba(1,32,63,0.12)]";
const STICKY_RIGHT_BODY =
  "sticky right-0 z-20 w-12 bg-white shadow-[-6px_0_8px_-6px_rgba(1,32,63,0.12)]";

function CellShell({
  field,
  row,
  issues,
  children,
}: {
  field: ImportEditableField | "id";
  row: ImportWorkspaceRow;
  issues: ImportValidationIssue[];
  children: ReactNode;
}) {
  const fieldIssues = issuesForImportProduct(issues, row.productId, field);
  const blocked = fieldIssues.some((issue) => issue.status === "blocked");
  const warning = fieldIssues.some((issue) => issue.status === "warning");
  const changed =
    field === "id"
      ? row.original.id !== row.pending.id
      : row.changedFields.includes(field as ImportEditableField);

  return (
    <div
      className={cn(
        "min-w-[8rem] space-y-1 rounded-md p-1",
        blocked && "bg-red-50 ring-1 ring-red-200",
        !blocked && warning && "bg-amber-50 ring-1 ring-amber-200",
        !blocked && !warning && changed && "bg-emerald-50 ring-1 ring-emerald-200"
      )}
    >
      {children}
      {fieldIssues.map((issue) => (
        <p
          key={`${issue.field}-${issue.message}`}
          className={cn(
            "text-[10px] leading-tight",
            issue.status === "blocked" ? "text-red-700" : "text-amber-800"
          )}
        >
          {issue.message}
        </p>
      ))}
    </div>
  );
}

export function BulkImportTable({
  rows,
  issues,
  catalog,
  preferredLocale = "en",
  onPatch,
  onRemove,
}: Props) {
  const t = useTranslations("admin.products.bulkImport");
  const categories = categoryOptions(catalog, preferredLocale);
  const brands = brandOptions(catalog, preferredLocale);

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-white">
      <table className="w-full min-w-[1200px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="bg-oboya-soft-white">
            <th className={cn(TH, STICKY_LEFT_PRODUCT)}>{t("colProduct")}</th>
            <th className={TH}>{t("colSku")}</th>
            <th className={TH}>{t("colId")}</th>
            <th className={TH}>{t("colMoq")}</th>
            <th className={TH}>{t("colCategory")}</th>
            <th className={TH}>{t("colSubcategory")}</th>
            <th className={TH}>{t("colBrand")}</th>
            <th className={TH}>{t("colUsd")}</th>
            <th className={TH}>{t("colBrl")}</th>
            <th className={TH}>{t("colEur")}</th>
            <th className={TH}>{t("colStock")}</th>
            <th className={TH}>{t("colStatus")}</th>
            <th className={cn(TH, STICKY_RIGHT_HEAD)} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const product = row.pending;
            const subs = subcategoryOptions(catalog, product.categoryId, preferredLocale);

            return (
              <tr key={row.productId} className="align-top">
                <td className={cn(TD, STICKY_LEFT_PRODUCT_BODY)}>
                  <CellShell field="name" row={row} issues={issues}>
                    <Input
                      value={product.name.en}
                      onChange={(event) =>
                        onPatch(row.productId, { nameEn: event.target.value })
                      }
                      className={cn(CONTROL, "min-w-[140px]")}
                      placeholder={t("namePlaceholder")}
                    />
                  </CellShell>
                </td>
                <td className={TD}>
                  <CellShell field="sku" row={row} issues={issues}>
                    <Input
                      value={product.sku}
                      onChange={(event) => onPatch(row.productId, { sku: event.target.value })}
                      className={cn(CONTROL, "min-w-[100px] font-mono text-xs")}
                    />
                  </CellShell>
                </td>
                <td className={TD}>
                  <CellShell field="id" row={row} issues={issues}>
                    <Input
                      value={product.id}
                      onChange={(event) => onPatch(row.productId, { id: event.target.value })}
                      className={cn(CONTROL, "min-w-[100px] font-mono text-xs")}
                    />
                  </CellShell>
                </td>
                <td className={TD}>
                  <CellShell field="moq" row={row} issues={issues}>
                    <Input
                      type="number"
                      min={1}
                      value={product.moq}
                      onChange={(event) =>
                        onPatch(row.productId, { moq: Number(event.target.value) || 1 })
                      }
                      className={cn(CONTROL, "w-20")}
                    />
                  </CellShell>
                </td>
                <td className={TD}>
                  <CellShell field="categoryId" row={row} issues={issues}>
                    <select
                      className={cn(PRODUCT_EDITOR_SELECT_CLASS, CONTROL, "min-w-[130px]")}
                      value={product.categoryId || ""}
                      onChange={(event) => {
                        const nextCategoryId = event.target.value;
                        const nextCategory = catalog.categories.find(
                          (category) => category.id === nextCategoryId
                        );
                        onPatch(row.productId, {
                          categoryId: nextCategoryId,
                          subcategoryId: nextCategory?.subcategories[0]?.id ?? "",
                        });
                      }}
                    >
                      <option value="">{t("none")}</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </CellShell>
                </td>
                <td className={TD}>
                  <CellShell field="subcategoryId" row={row} issues={issues}>
                    <select
                      className={cn(PRODUCT_EDITOR_SELECT_CLASS, CONTROL, "min-w-[130px]")}
                      value={product.subcategoryId || ""}
                      disabled={!product.categoryId}
                      onChange={(event) =>
                        onPatch(row.productId, { subcategoryId: event.target.value })
                      }
                    >
                      <option value="">{t("none")}</option>
                      {subs.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </CellShell>
                </td>
                <td className={TD}>
                  <CellShell field="brandId" row={row} issues={issues}>
                    <select
                      className={cn(PRODUCT_EDITOR_SELECT_CLASS, CONTROL, "min-w-[130px]")}
                      value={product.brandId || ""}
                      onChange={(event) =>
                        onPatch(row.productId, { brandId: event.target.value })
                      }
                    >
                      <option value="">{t("none")}</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </CellShell>
                </td>
                <td className={TD}>
                  <CellShell field="priceUsd" row={row} issues={issues}>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={product.prices.USD ?? ""}
                      onChange={(event) =>
                        onPatch(row.productId, {
                          priceUsd:
                            event.target.value === "" ? null : Number(event.target.value),
                        })
                      }
                      className={cn(CONTROL, "w-24")}
                    />
                  </CellShell>
                </td>
                <td className={TD}>
                  <CellShell field="priceBrl" row={row} issues={issues}>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={product.prices.BRL ?? ""}
                      onChange={(event) =>
                        onPatch(row.productId, {
                          priceBrl:
                            event.target.value === "" ? null : Number(event.target.value),
                        })
                      }
                      className={cn(CONTROL, "w-24")}
                    />
                  </CellShell>
                </td>
                <td className={TD}>
                  <CellShell field="priceEur" row={row} issues={issues}>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={product.prices.EUR ?? ""}
                      onChange={(event) =>
                        onPatch(row.productId, {
                          priceEur:
                            event.target.value === "" ? null : Number(event.target.value),
                        })
                      }
                      className={cn(CONTROL, "w-24")}
                    />
                  </CellShell>
                </td>
                <td className={TD}>
                  <CellShell field="stockQuantity" row={row} issues={issues}>
                    <Input
                      type="number"
                      min={0}
                      value={product.stockQuantity ?? ""}
                      onChange={(event) =>
                        onPatch(row.productId, {
                          stockQuantity:
                            event.target.value === "" ? null : Number(event.target.value),
                          unlimitedStock: event.target.value === "",
                        })
                      }
                      className={cn(CONTROL, "w-20")}
                    />
                  </CellShell>
                </td>
                <td className={TD}>
                  <CellShell field="status" row={row} issues={issues}>
                    <select
                      className={cn(PRODUCT_EDITOR_SELECT_CLASS, CONTROL, "min-w-[110px]")}
                      value={product.status}
                      onChange={(event) =>
                        onPatch(row.productId, { status: event.target.value as CmsStatus })
                      }
                    >
                      <option value="draft">{t("status.draft")}</option>
                      <option value="published">{t("status.published")}</option>
                      <option value="archived">{t("status.archived")}</option>
                    </select>
                  </CellShell>
                </td>
                <td className={cn(TD, STICKY_RIGHT_BODY)}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-red-600"
                    onClick={() => onRemove(row.productId)}
                    aria-label={t("removeRow")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("emptyTable")}</p>
      )}
    </div>
  );
}
