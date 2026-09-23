"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BulkImportProgress } from "@/components/admin/marketplace/bulk-import/BulkImportProgress";
import { BulkImportReviewDialog } from "@/components/admin/marketplace/bulk-import/BulkImportReviewDialog";
import { BulkImportTable } from "@/components/admin/marketplace/bulk-import/BulkImportTable";
import { SpreadsheetImportPanel } from "@/components/admin/marketplace/bulk-import/SpreadsheetImportPanel";
import { Button } from "@/components/ui/button";
import {
  applyBulkImportsSequentially,
  type ImportApplyProgress,
} from "@/lib/cms/bulk-import/apply-sequential";
import {
  applyImportPatch,
  refreshImportChangedFields,
} from "@/lib/cms/bulk-import/diff";
import {
  summarizeImportValidation,
  validateBulkImport,
} from "@/lib/cms/bulk-import/validate";
import {
  BULK_IMPORT_MAX_PRODUCTS,
  type ImportApplyResult,
  type ImportCatalog,
  type ImportProductPatch,
  type ImportValidationIssue,
  type ImportWorkspaceRow,
} from "@/lib/cms/bulk-import/types";
import { collectAllSkus } from "@/lib/cms/admin-sku-lookup";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";
import { useAdminMarketplaceCatalog } from "@/hooks/use-admin-marketplace-catalog";

export function BulkImportWorkspace() {
  const t = useTranslations("admin.products.bulkImport");
  const tCommon = useTranslations("admin.common");
  const { locale } = useAdminLocale();
  const { catalog: liveCatalog, loading: catalogLoading } = useAdminMarketplaceCatalog();
  const [existingProducts, setExistingProducts] = useState<CmsProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [rows, setRows] = useState<ImportWorkspaceRow[]>([]);
  const [serverIssues, setServerIssues] = useState<ImportValidationIssue[] | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState<ImportApplyProgress | null>(null);
  const [results, setResults] = useState<ImportApplyResult[] | null>(null);

  const catalog: ImportCatalog = useMemo(
    () => ({
      categories: liveCatalog.categories,
      brands: liveCatalog.brands,
      countries: liveCatalog.countries,
      filterOptions: liveCatalog.filterOptions,
      existingIds: new Set([
        ...existingProducts.map((product) => product.id),
        ...Array.from(collectAllSkus(existingProducts, { includeLegacyIds: true })),
      ]),
      existingSkus: collectAllSkus(existingProducts, { includeLegacyIds: true }),
    }),
    [liveCatalog, existingProducts]
  );

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch("/api/cms/products?includeDeleted=1", {
        cache: "no-store",
      });
      if (!response.ok) {
        toast.error(t("loadFailed"));
        return;
      }
      const list = (await response.json()) as CmsProduct[];
      setExistingProducts(list.filter((product) => !product.deletedAt));
    } finally {
      setLoadingProducts(false);
    }
  }, [t]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const clientIssues = useMemo(
    () => validateBulkImport(rows, catalog),
    [rows, catalog]
  );
  const issues = serverIssues ?? clientIssues;
  const summary = useMemo(() => summarizeImportValidation(issues), [issues]);
  const changedCount = rows.filter((row) => row.changedFields.length > 0).length;
  const blockedCount = summary.blockedCount;

  const patchRow = (productId: string, patch: ImportProductPatch) => {
    setServerIssues(null);
    setRows((current) =>
      current.map((row) => {
        if (row.productId !== productId) return row;
        const pending = applyImportPatch(row.pending, patch);
        return refreshImportChangedFields({
          ...row,
          productId: pending.id,
          pending,
        });
      })
    );
  };

  const removeProduct = (productId: string) => {
    setServerIssues(null);
    setRows((current) => current.filter((row) => row.productId !== productId));
  };

  const clearWorkspace = () => {
    setServerIssues(null);
    setRows([]);
    setResults(null);
    setProgress(null);
  };

  const openReview = async () => {
    if (rows.length === 0) {
      toast.error(t("noProducts"));
      return;
    }

    try {
      const response = await fetch("/api/cms/products/bulk-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "create",
          products: rows.map((row) => row.pending),
        }),
      });
      if (response.ok) {
        const payload = (await response.json()) as { issues: ImportValidationIssue[] };
        setServerIssues(payload.issues);
        if (payload.issues.some((issue) => issue.status === "blocked")) {
          toast.error(t("serverBlocked"));
        }
      }
    } catch {
      // Client validation already present; continue to review.
    }

    setReviewOpen(true);
  };

  const confirmApply = async () => {
    setReviewOpen(false);
    if (blockedCount > 0) {
      toast.error(t("resolveBlocked"));
      return;
    }

    const readyRows = rows.filter(
      (row) =>
        !issues.some((issue) => issue.productId === row.productId && issue.status === "blocked")
    );
    if (readyRows.length === 0) {
      toast.error(t("noProducts"));
      return;
    }

    setApplying(true);
    setResults(null);
    try {
      const applyResults = await applyBulkImportsSequentially({
        rows: readyRows,
        onProgress: setProgress,
      });
      setResults(applyResults);
      const successIds = new Set(
        applyResults
          .filter((item) => item.status === "SUCCESS")
          .map((item) => item.productId)
      );
      await loadProducts();
      setRows((current) => current.filter((row) => !successIds.has(row.productId)));
      toast.success(
        t("importedCount", {
          count: applyResults.filter((item) => item.status === "SUCCESS").length,
        })
      );
    } finally {
      setApplying(false);
    }
  };

  const loading = loadingProducts || catalogLoading;

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="min-h-[40vh]" aria-hidden />
      ) : (
        <>
          <SpreadsheetImportPanel
            catalog={catalog}
            disabled={applying}
            onLoaded={(nextRows, truncated) => {
              setServerIssues(null);
              setResults(null);
              setRows(nextRows);
              if (truncated) {
                toast.error(t("importLimited", { max: BULK_IMPORT_MAX_PRODUCTS }));
              } else if (nextRows.length > 0) {
                toast.success(t("importSuccess", { count: nextRows.length }));
              }
            }}
          />

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-oboya-blue-dark">
                {t("previewProducts", {
                  count: rows.length,
                  max: BULK_IMPORT_MAX_PRODUCTS,
                })}
              </p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="text-emerald-700">{t("changed", { count: changedCount })}</span>
                <span className="text-amber-700">
                  {t("warnings", { count: summary.warningCount })}
                </span>
                <span className="text-red-700">{t("blocked", { count: blockedCount })}</span>
              </div>
            </div>
            <BulkImportTable
              rows={rows}
              catalog={catalog}
              issues={issues}
              preferredLocale={locale}
              onRemove={removeProduct}
              onPatch={patchRow}
            />
          </div>

          <BulkImportProgress
            running={applying}
            progress={progress}
            results={results}
            onClose={() => {
              setResults(null);
              setProgress(null);
            }}
          />

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={applying || rows.length === 0}
              onClick={clearWorkspace}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              className="rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
              disabled={applying || rows.length === 0 || blockedCount > 0}
              onClick={() => void openReview()}
            >
              {t("importProducts")}
            </Button>
          </div>

          <BulkImportReviewDialog
            open={reviewOpen}
            onOpenChange={setReviewOpen}
            rows={rows}
            issues={issues}
            onConfirm={() => void confirmApply()}
          />
        </>
      )}
    </div>
  );
}
