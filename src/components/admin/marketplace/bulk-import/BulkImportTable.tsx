"use client";

import Image from "next/image";
import { ImageIcon, Trash2 } from "lucide-react";
import { Fragment, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { PRODUCT_EDITOR_SELECT_CLASS } from "@/components/admin/marketplace/product-editor.constants";
import { BulkPriceInput } from "@/components/admin/marketplace/bulk-update/BulkPriceInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ImageField } from "@/components/admin/media/ImageField";
import {
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

/** Header cells in the table; keep in sync with the <thead> above. */
const IMPORT_TABLE_COLUMNS = 16;

const TH =
  "whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-oboya-blue-dark/70";
const TD = "border-b border-border/40 px-3 py-3 align-middle";
const CONTROL = "h-9 text-sm";
const STICKY_LEFT_PRODUCT =
  "sticky left-0 z-30 min-w-[16rem] border-r border-border/70 bg-oboya-soft-white shadow-[6px_0_10px_-6px_rgba(1,32,63,0.14)]";
const STICKY_LEFT_PRODUCT_BODY =
  "sticky left-0 z-20 min-w-[16rem] border-r border-border/70 bg-white shadow-[6px_0_10px_-6px_rgba(1,32,63,0.14)]";
const STICKY_RIGHT_HEAD =
  "sticky right-0 z-30 w-12 bg-oboya-soft-white text-center shadow-[-6px_0_8px_-6px_rgba(1,32,63,0.12)]";
const STICKY_RIGHT_BODY =
  "sticky right-0 z-20 w-12 bg-white shadow-[-6px_0_8px_-6px_rgba(1,32,63,0.12)]";

function CellShell({
  field,
  row,
  issues,
  hideIssues = false,
  children,
}: {
  field: ImportEditableField;
  row: ImportWorkspaceRow;
  issues: ImportValidationIssue[];
  /** Highlight only; the message is shown by a sibling cell sharing the same field. */
  hideIssues?: boolean;
  children: ReactNode;
}) {
  const fieldIssues = issuesForImportProduct(issues, row.productId, field);
  const blocked = fieldIssues.some((issue) => issue.status === "blocked");
  const warning = fieldIssues.some((issue) => issue.status === "warning");
  const changed = row.changedFields.includes(field);

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
      {(hideIssues ? [] : fieldIssues).map((issue) => (
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

function ImportImageThumb({
  src,
  alt,
  onOpen,
  openLabel,
}: {
  src: string | undefined;
  alt: string;
  onOpen: () => void;
  openLabel: string;
}) {
  return (
    <button
      type="button"
      disabled={!src}
      onClick={onOpen}
      aria-label={openLabel}
      className={cn(
        "relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/50",
        src
          ? "cursor-zoom-in transition hover:ring-oboya-blue-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-blue-light"
          : "cursor-default opacity-60"
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="56px"
          unoptimized
        />
      ) : null}
    </button>
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
  const [openImagesId, setOpenImagesId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ src: string; title: string } | null>(
    null
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-white">
      <table className="w-full min-w-[2400px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="bg-oboya-soft-white">
            <th className={cn(TH, STICKY_LEFT_PRODUCT)}>{t("colProduct")}</th>
            <th className={TH}>{t("colSku")}</th>
            <th className={TH}>{t("colMoq")}</th>
            <th className={TH}>{t("colCategory")}</th>
            <th className={TH}>{t("colSubcategory")}</th>
            <th className={TH}>{t("colUsd")}</th>
            <th className={TH}>{t("colBrl")}</th>
            <th className={TH}>{t("colEur")}</th>
            <th className={TH}>{t("colStock")}</th>
            <th className={TH}>{t("colStatus")}</th>
            <th className={TH}>{t("colImages")}</th>
            <th className={TH}>{t("colShortEn")}</th>
            <th className={TH}>{t("colShortPtBr")}</th>
            <th className={TH}>{t("colShortEs")}</th>
            <th className={TH}>{t("colShortZhCn")}</th>
            <th className={cn(TH, STICKY_RIGHT_HEAD)} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const product = row.pending;
            const image = product.images.find((url) => Boolean(url?.trim()));
            const subs = subcategoryOptions(catalog, product.categoryId, preferredLocale);
            const title = product.name.en || product.sku || product.id;

            const filledImages = product.images.filter((url) => Boolean(url?.trim()));
            const imagesOpen = openImagesId === row.productId;
            const shortCells = [
              ["shortEn", "en"],
              ["shortPt", "pt-BR"],
              ["shortEs", "es"],
              ["shortZh", "zh-CN"],
            ] as const;

            return (
              <Fragment key={row.productId}>
              <tr className="align-top">
                <td className={cn(TD, STICKY_LEFT_PRODUCT_BODY)}>
                  <div className="flex min-w-[16rem] items-start gap-3 pr-1">
                    <ImportImageThumb
                      src={image}
                      alt={title}
                      openLabel={t("openImagePreview", { name: title })}
                      onOpen={() => {
                        if (!image) return;
                        setPreview({ src: image, title });
                      }}
                    />
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
                  </div>
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
                <td className={cn(TD, "min-w-[11rem]")}>
                  <CellShell field="priceUsd" row={row} issues={issues}>
                    <BulkPriceInput
                      currency="USD"
                      value={product.prices.USD}
                      onChange={(next) =>
                        onPatch(row.productId, { priceUsd: next })
                      }
                    />
                  </CellShell>
                </td>
                <td className={cn(TD, "min-w-[11rem]")}>
                  <CellShell field="priceBrl" row={row} issues={issues}>
                    <BulkPriceInput
                      currency="BRL"
                      value={product.prices.BRL}
                      onChange={(next) =>
                        onPatch(row.productId, { priceBrl: next })
                      }
                    />
                  </CellShell>
                </td>
                <td className={cn(TD, "min-w-[11rem]")}>
                  <CellShell field="priceEur" row={row} issues={issues}>
                    <BulkPriceInput
                      currency="EUR"
                      value={product.prices.EUR}
                      onChange={(next) =>
                        onPatch(row.productId, { priceEur: next })
                      }
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
                <td className={TD}>
                  <CellShell field="images" row={row} issues={issues}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5"
                      aria-expanded={imagesOpen}
                      onClick={() => setOpenImagesId(imagesOpen ? null : row.productId)}
                    >
                      <ImageIcon className="size-3.5" />
                      {imagesOpen
                        ? t("imagesHide")
                        : t("imagesEdit", { count: filledImages.length })}
                    </Button>
                  </CellShell>
                </td>
                {shortCells.map(([patchKey, locale]) => (
                  <td key={patchKey} className={cn(TD, "min-w-[12rem]")}>
                    <CellShell
                      field="shortDescription"
                      row={row}
                      issues={issues}
                      hideIssues={locale !== "en"}
                    >
                      <Input
                        value={product.shortDescription?.[locale] ?? ""}
                        onChange={(event) =>
                          onPatch(row.productId, { [patchKey]: event.target.value })
                        }
                        className={cn(CONTROL, "min-w-[10rem]")}
                      />
                    </CellShell>
                  </td>
                ))}
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
              {imagesOpen && (
                <tr>
                  <td colSpan={IMPORT_TABLE_COLUMNS} className="border-b border-border/40 bg-oboya-soft-white/40 px-3 py-3">
                    <p className="mb-2 text-xs text-muted-foreground">{t("imagesHint")}</p>
                    <div className="grid gap-3 md:grid-cols-3">
                      {[0, 1, 2].map((slot) => (
                        <ImageField
                          key={slot}
                          label={t("imageSlot", { n: slot + 1 })}
                          optional={slot > 0}
                          value={filledImages[slot] ?? ""}
                          onChange={(url) => {
                            const next = [0, 1, 2].map((i) => filledImages[i] ?? "");
                            next[slot] = url;
                            onPatch(row.productId, { images: next });
                          }}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("emptyTable")}</p>
      )}

      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent
          className="max-h-[min(96vh,1200px)] w-auto max-w-[min(96vw,1600px)] overflow-auto p-3 sm:max-w-[min(96vw,1600px)]"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{preview?.title ?? t("imagePreviewTitle")}</DialogTitle>
            <DialogDescription>{t("imagePreviewDescription")}</DialogDescription>
          </DialogHeader>
          {preview ? (
            // Native img so the browser can show intrinsic file dimensions.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.src}
              alt={preview.title}
              className="mx-auto h-auto w-auto max-w-none"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
