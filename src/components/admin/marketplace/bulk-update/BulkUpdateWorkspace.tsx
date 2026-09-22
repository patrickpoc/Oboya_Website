"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BulkChangeReviewDialog } from "@/components/admin/marketplace/bulk-update/BulkChangeReviewDialog";
import { BulkColumnActions } from "@/components/admin/marketplace/bulk-update/BulkColumnActions";
import {
  BULK_UPDATE_MAX_PRODUCTS,
  BulkProductTable,
} from "@/components/admin/marketplace/bulk-update/BulkProductTable";
import { BulkUpdateProgress } from "@/components/admin/marketplace/bulk-update/BulkUpdateProgress";
import { ProductSearchAutocomplete } from "@/components/admin/marketplace/bulk-update/ProductSearchAutocomplete";
import { SpreadsheetImportPanel } from "@/components/admin/marketplace/bulk-update/SpreadsheetImportPanel";
import { Button } from "@/components/ui/button";
import {
  applyBulkUpdatesSequentially,
  type SequentialApplyProgress,
} from "@/lib/cms/bulk-update/apply-sequential";
import {
  applyPatchToProduct,
  createWorkspaceRow,
  getChangedFields,
  refreshRowChangedFields,
} from "@/lib/cms/bulk-update/diff";
import {
  summarizeValidation,
  validateBulkUpdate,
} from "@/lib/cms/bulk-update/validate";
import type {
  BulkApplyResult,
  BulkProductPatch,
  BulkUpdateCatalog,
  BulkValidationIssue,
  BulkWorkspaceRow,
} from "@/lib/cms/bulk-update/types";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";
import { useAdminMarketplaceCatalog } from "@/hooks/use-admin-marketplace-catalog";

export function BulkUpdateWorkspace() {
  const t = useTranslations("admin.products.bulk");
  const tCommon = useTranslations("admin.common");
  const { locale } = useAdminLocale();
  const { catalog: liveCatalog, loading: catalogLoading } = useAdminMarketplaceCatalog();
  const [products, setProducts] = useState<CmsProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [rows, setRows] = useState<BulkWorkspaceRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [serverIssues, setServerIssues] = useState<BulkValidationIssue[] | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState<SequentialApplyProgress | null>(null);
  const [results, setResults] = useState<BulkApplyResult[] | null>(null);

  const catalog: BulkUpdateCatalog = useMemo(
    () => ({
      categories: liveCatalog.categories,
      brands: liveCatalog.brands,
      countries: liveCatalog.countries,
      filterOptions: liveCatalog.filterOptions,
    }),
    [liveCatalog]
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
      setProducts(list.filter((product) => !product.deletedAt));
    } finally {
      setLoadingProducts(false);
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingProducts(true);
      try {
        const response = await fetch("/api/cms/products?includeDeleted=1", {
          cache: "no-store",
        });
        if (!response.ok) {
          if (!cancelled) toast.error(t("loadFailed"));
          return;
        }
        const list = (await response.json()) as CmsProduct[];
        if (!cancelled) {
          setProducts(list.filter((product) => !product.deletedAt));
        }
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const clientIssues = useMemo(
    () => validateBulkUpdate(rows, catalog),
    [rows, catalog]
  );
  const issues = serverIssues ?? clientIssues;

  const excludeIds = useMemo(
    () => new Set(rows.map((row) => row.productId)),
    [rows]
  );

  const summary = useMemo(() => summarizeValidation(issues), [issues]);
  const changedCount = rows.filter((row) => row.changedFields.length > 0).length;
  const blockedCount = summary.blockedCount;

  const patchRow = (productId: string, patch: BulkProductPatch) => {
    setServerIssues(null);
    setRows((current) =>
      current.map((row) => {
        if (row.productId !== productId) return row;
        const pending = applyPatchToProduct(row.pending, patch);
        return refreshRowChangedFields({ ...row, pending });
      })
    );
  };

  const addProduct = (product: CmsProduct) => {
    if (rows.length >= BULK_UPDATE_MAX_PRODUCTS) {
      toast.error(t("maxSelect", { max: BULK_UPDATE_MAX_PRODUCTS }));
      return;
    }
    if (rows.some((row) => row.productId === product.id)) return;

    setServerIssues(null);
    setResults(null);

    // Optimistically add from search hit, then hydrate with full product record.
    setRows((current) => {
      if (current.some((row) => row.productId === product.id)) return current;
      if (current.length >= BULK_UPDATE_MAX_PRODUCTS) return current;
      return [...current, createWorkspaceRow(product)];
    });
    setSelectedIds((current) => new Set(current).add(product.id));

    void (async () => {
      try {
        const response = await fetch(`/api/cms/products/${product.id}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const full = (await response.json()) as CmsProduct;
        setRows((current) => {
          const exists = current.some((row) => row.productId === full.id);
          if (!exists) {
            if (current.length >= BULK_UPDATE_MAX_PRODUCTS) return current;
            return [...current, createWorkspaceRow(full)];
          }
          return current.map((row) => {
            if (row.productId !== full.id) return row;
            // Preserve any local edits already made; only hydrate if unchanged.
            if (row.changedFields.length > 0) return row;
            return createWorkspaceRow(full);
          });
        });
      } catch {
        // Keep the search-hit snapshot already in the workspace.
      }
    })();
  };

  const removeProduct = (productId: string) => {
    setServerIssues(null);
    setRows((current) => current.filter((row) => row.productId !== productId));
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(productId);
      return next;
    });
  };

  const applyColumnPatch = (patch: BulkProductPatch) => {
    if (selectedIds.size === 0) {
      toast.error(t("selectAtLeastOne"));
      return;
    }
    setServerIssues(null);
    setRows((current) =>
      current.map((row) => {
        if (!selectedIds.has(row.productId)) return row;
        const pending = applyPatchToProduct(row.pending, patch);
        return refreshRowChangedFields({ ...row, pending });
      })
    );
    toast.success(t("appliedTo", { count: selectedIds.size }));
  };

  const clearWorkspace = () => {
    setServerIssues(null);
    setRows([]);
    setSelectedIds(new Set());
    setResults(null);
    setProgress(null);
  };

  const openReview = async () => {
    if (changedCount === 0) {
      toast.error(t("noPending"));
      return;
    }

    const updates = rows
      .filter((row) => getChangedFields(row.original, row.pending).length > 0)
      .map((row) => ({
        id: row.productId,
        patch: Object.fromEntries(
          row.changedFields.map((field) => {
            const pending = row.pending;
            switch (field) {
              case "moq":
                return [field, pending.moq] as const;
              case "categoryId":
                return [field, pending.categoryId] as const;
              case "subcategoryId":
                return [field, pending.subcategoryId] as const;
              case "brandId":
                return [field, pending.brandId] as const;
              case "application":
                return [field, pending.application] as const;
              case "cultures":
                return [field, pending.cultures] as const;
              case "certifications":
                return [field, pending.certifications] as const;
              case "countryOfOrigin":
                return [field, pending.countryOfOrigin] as const;
              case "enabledCountries":
                return [
                  field,
                  pending.enabledCountries ?? pending.availability,
                ] as const;
              case "status":
                return [field, pending.status] as const;
            }
          })
        ) as BulkProductPatch,
      }));

    try {
      const response = await fetch("/api/cms/products/bulk-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (response.ok) {
        const payload = (await response.json()) as { issues: BulkValidationIssue[] };
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
    setApplying(true);
    setResults(null);
    try {
      const applyResults = await applyBulkUpdatesSequentially({
        rows,
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
      setSelectedIds((current) => {
        const next = new Set(current);
        successIds.forEach((id) => next.delete(id));
        return next;
      });
      toast.success(
        t("updatedCount", {
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
          <div className="rounded-xl border border-border/60 bg-white p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-oboya-blue-dark">{t("searchProducts")}</p>
              <p className="text-xs font-normal text-muted-foreground">
                {t("selectedFraction", { count: rows.length, max: BULK_UPDATE_MAX_PRODUCTS })}
              </p>
            </div>
            <ProductSearchAutocomplete
              products={products}
              excludeIds={excludeIds}
              disabled={rows.length >= BULK_UPDATE_MAX_PRODUCTS}
              onSelect={addProduct}
              preferredLocale={locale}
            />
            {rows.length >= BULK_UPDATE_MAX_PRODUCTS && (
              <p className="mt-2 text-xs text-amber-700">
                {t("maxReached", { max: BULK_UPDATE_MAX_PRODUCTS })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-oboya-blue-dark">
                {t("selectedProducts", { count: rows.length, max: BULK_UPDATE_MAX_PRODUCTS })}
              </p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="text-emerald-700">{t("changed", { count: changedCount })}</span>
                <span className="text-amber-700">{t("warnings", { count: summary.warningCount })}</span>
                <span className="text-red-700">{t("blocked", { count: blockedCount })}</span>
              </div>
            </div>
            <BulkProductTable
              rows={rows}
              catalog={catalog}
              issues={issues}
              selectedIds={selectedIds}
              preferredLocale={locale}
              onToggleSelect={(productId) => {
                setSelectedIds((current) => {
                  const next = new Set(current);
                  if (next.has(productId)) next.delete(productId);
                  else next.add(productId);
                  return next;
                });
              }}
              onToggleSelectAll={() => {
                setSelectedIds((current) => {
                  if (rows.every((row) => current.has(row.productId))) {
                    return new Set();
                  }
                  return new Set(rows.map((row) => row.productId));
                });
              }}
              onRemove={removeProduct}
              onPatch={patchRow}
            />
          </div>

          <BulkColumnActions
            catalog={catalog}
            selectedCount={selectedIds.size}
            onApply={applyColumnPatch}
          />

          <SpreadsheetImportPanel
            products={products}
            catalog={catalog}
            existingRows={rows}
            onImported={(nextRows, errors) => {
              setServerIssues(null);
              const capped = nextRows.slice(0, BULK_UPDATE_MAX_PRODUCTS);
              setRows(capped);
              setSelectedIds(new Set(capped.map((row) => row.productId)));
              if (nextRows.length > BULK_UPDATE_MAX_PRODUCTS) {
                toast.error(
                  t("importLimited", { max: BULK_UPDATE_MAX_PRODUCTS })
                );
              } else if (errors.length === 0) {
                toast.success(t("importSuccess"));
              } else {
                toast.error(t("importWithErrors"));
              }
            }}
          />

          <BulkUpdateProgress
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
              disabled={applying || changedCount === 0 || blockedCount > 0}
              onClick={() => void openReview()}
            >
              {t("applyChanges")}
            </Button>
          </div>

          <BulkChangeReviewDialog
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
