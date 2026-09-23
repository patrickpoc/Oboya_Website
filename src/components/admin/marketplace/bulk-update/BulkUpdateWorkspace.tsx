"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BulkChangeReviewDialog } from "@/components/admin/marketplace/bulk-update/BulkChangeReviewDialog";
import { BulkColumnActions } from "@/components/admin/marketplace/bulk-update/BulkColumnActions";
import { BulkProductTable } from "@/components/admin/marketplace/bulk-update/BulkProductTable";
import { BulkUpdateProgress } from "@/components/admin/marketplace/bulk-update/BulkUpdateProgress";
import { ProductSearchAutocomplete } from "@/components/admin/marketplace/bulk-update/ProductSearchAutocomplete";
import { SpreadsheetImportPanel } from "@/components/admin/marketplace/bulk-update/SpreadsheetImportPanel";
import { Button } from "@/components/ui/button";
import { countProductGroups } from "@/lib/cms/admin-sku-lookup";
import {
  applyBulkUpdatesSequentially,
  type SequentialApplyProgress,
} from "@/lib/cms/bulk-update/apply-sequential";
import {
  applyPatchToProduct,
  createWorkspaceGroup,
  productHasPendingChanges,
  replaceOrInsertGroup,
  syncGroupPending,
} from "@/lib/cms/bulk-update/diff";
import {
  summarizeValidation,
  validateBulkUpdate,
} from "@/lib/cms/bulk-update/validate";
import type { BulkSkuSearchHit } from "@/lib/cms/bulk-update/search-products";
import {
  BULK_UPDATE_MAX_PRODUCTS,
  type BulkApplyResult,
  type BulkProductPatch,
  type BulkUpdateCatalog,
  type BulkValidationIssue,
  type BulkWorkspaceRow,
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
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
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

  const groupCount = useMemo(() => countProductGroups(rows), [rows]);

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
  const changedProductIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of rows) {
      if (productHasPendingChanges(row.original, row.pending)) {
        ids.add(row.productId);
      }
    }
    return ids;
  }, [rows]);
  const changedCount = changedProductIds.size;
  const blockedCount = summary.blockedCount;

  const patchRow = (
    productId: string,
    patch: BulkProductPatch,
    variantId?: string | null
  ) => {
    setServerIssues(null);
    setRows((current) => {
      const sample = current.find((row) => row.productId === productId);
      if (!sample) return current;
      const pending = applyPatchToProduct(sample.pending, patch, variantId);
      return syncGroupPending(current, productId, pending);
    });
  };

  const addFromHit = (hit: BulkSkuSearchHit) => {
    const product = hit.product;
    if (rows.some((row) => row.productId === product.id)) {
      const focusId = hit.variantId
        ? `${product.id}::${hit.variantId}`
        : product.id;
      setFocusRowId(focusId);
      setSelectedIds((current) => new Set(current).add(product.id));
      return;
    }
    if (groupCount >= BULK_UPDATE_MAX_PRODUCTS) {
      toast.error(t("maxSelect", { max: BULK_UPDATE_MAX_PRODUCTS }));
      return;
    }

    setServerIssues(null);
    setResults(null);
    setRows((current) => {
      if (current.some((row) => row.productId === product.id)) return current;
      if (countProductGroups(current) >= BULK_UPDATE_MAX_PRODUCTS) return current;
      return [...current, ...createWorkspaceGroup(product)];
    });
    setSelectedIds((current) => new Set(current).add(product.id));
    setFocusRowId(
      hit.variantId ? `${product.id}::${hit.variantId}` : product.id
    );

    void (async () => {
      try {
        const response = await fetch(`/api/cms/products/${product.id}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const full = (await response.json()) as CmsProduct;
        setRows((current) => {
          const existing = current.filter((row) => row.productId === full.id);
          if (existing.length === 0) {
            if (countProductGroups(current) >= BULK_UPDATE_MAX_PRODUCTS) {
              return current;
            }
            return [...current, ...createWorkspaceGroup(full)];
          }
          const hasEdits = existing.some((row) =>
            productHasPendingChanges(row.original, row.pending)
          );
          if (hasEdits) return current;
          return replaceOrInsertGroup(current, full);
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
    setRows((current) => {
      let next = current;
      for (const productId of selectedIds) {
        const sample = next.find((row) => row.productId === productId);
        if (!sample) continue;
        const pending = applyPatchToProduct(sample.pending, patch);
        next = syncGroupPending(next, productId, pending);
      }
      return next;
    });
    toast.success(t("appliedTo", { count: selectedIds.size }));
  };

  const clearWorkspace = () => {
    setServerIssues(null);
    setRows([]);
    setSelectedIds(new Set());
    setResults(null);
    setProgress(null);
    setFocusRowId(null);
  };

  const openReview = async () => {
    if (changedCount === 0) {
      toast.error(t("noPending"));
      return;
    }

    const updates = Array.from(changedProductIds).map((productId) => {
      const sample = rows.find((row) => row.productId === productId)!;
      const pending = sample.pending;
      return {
        id: productId,
        patch: {
          moq: pending.moq,
          categoryId: pending.categoryId,
          subcategoryId: pending.subcategoryId,
          brandId: pending.brandId,
          application: pending.application,
          cultures: pending.cultures,
          certifications: pending.certifications,
          countryOfOrigin: pending.countryOfOrigin,
          enabledCountries: pending.enabledCountries ?? pending.availability,
          status: pending.status,
          priceUsd: pending.prices?.USD ?? null,
          priceBrl: pending.prices?.BRL ?? null,
          priceEur: pending.prices?.EUR ?? null,
        } satisfies BulkProductPatch,
      };
    });

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
                {t("selectedFraction", {
                  count: groupCount,
                  max: BULK_UPDATE_MAX_PRODUCTS,
                })}{" "}
                {t("productGroupsHint")}
              </p>
            </div>
            <ProductSearchAutocomplete
              products={products}
              excludeIds={excludeIds}
              disabled={groupCount >= BULK_UPDATE_MAX_PRODUCTS}
              onSelect={addFromHit}
              preferredLocale={locale}
            />
            {groupCount >= BULK_UPDATE_MAX_PRODUCTS && (
              <p className="mt-2 text-xs text-amber-700">
                {t("maxReached", { max: BULK_UPDATE_MAX_PRODUCTS })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-oboya-blue-dark">
                {t("selectedProducts", {
                  count: groupCount,
                  max: BULK_UPDATE_MAX_PRODUCTS,
                })}
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
              focusRowId={focusRowId}
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
                  const ids = Array.from(new Set(rows.map((row) => row.productId)));
                  if (ids.every((id) => current.has(id))) {
                    return new Set();
                  }
                  return new Set(ids);
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
              const productIds: string[] = [];
              const capped: BulkWorkspaceRow[] = [];
              for (const row of nextRows) {
                if (!productIds.includes(row.productId)) {
                  if (productIds.length >= BULK_UPDATE_MAX_PRODUCTS) continue;
                  productIds.push(row.productId);
                }
                if (productIds.includes(row.productId)) {
                  capped.push(row);
                }
              }
              setRows(capped);
              setSelectedIds(new Set(productIds));
              if (countProductGroups(nextRows) > BULK_UPDATE_MAX_PRODUCTS) {
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
