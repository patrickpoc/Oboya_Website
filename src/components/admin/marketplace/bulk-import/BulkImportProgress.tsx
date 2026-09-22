"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ImportApplyProgress } from "@/lib/cms/bulk-import/apply-sequential";
import type { ImportApplyResult } from "@/lib/cms/bulk-import/types";
import { displayProductName } from "@/lib/cms/bulk-update/search-products";

type Props = {
  running: boolean;
  progress: ImportApplyProgress | null;
  results: ImportApplyResult[] | null;
  onClose: () => void;
};

export function BulkImportProgress({ running, progress, results, onClose }: Props) {
  const t = useTranslations("admin.products.bulkImport");
  if (!running && !results) return null;

  const success = results?.filter((item) => item.status === "SUCCESS").length ?? 0;
  const failed = results?.filter((item) => item.status === "FAILED").length ?? 0;

  return (
    <div className="rounded-xl border border-border/60 bg-white p-4">
      {running && progress && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="size-8 animate-spin rounded-full border-2 border-oboya-green/25 border-t-oboya-green" />
            <div>
              <p className="text-sm font-semibold text-oboya-blue-dark">{t("importing")}</p>
              <p className="text-xs text-muted-foreground">
                {progress.index} / {progress.total}
              </p>
            </div>
          </div>
          {progress.current && (
            <p className="text-sm">
              {t("current")}{" "}
              <strong>{displayProductName(progress.current.pending)}</strong>
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                {t("skuLabel", { sku: progress.current.pending.sku })}
              </span>
            </p>
          )}
          {progress.lastResult?.status === "SUCCESS" && (
            <p className="text-sm text-emerald-700">{t("createdOk")}</p>
          )}
          {progress.lastResult?.status === "FAILED" && (
            <p className="text-sm text-red-700">
              {t("failedWithError", { error: progress.lastResult.error ?? "" })}
            </p>
          )}
        </div>
      )}

      {!running && results && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-oboya-blue-dark">
            {t("processed", { count: results.length })}
          </p>
          <p className="text-sm">{t("resultSummary", { success, failed })}</p>

          {failed > 0 && (
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {results
                .filter((item) => item.status === "FAILED")
                .map((item) => (
                  <div key={item.productId}>
                    <p className="font-semibold">
                      {item.name} · {t("skuLabel", { sku: item.sku })}
                    </p>
                    <p>{t("reason", { reason: item.error ?? "" })}</p>
                    {item.suggestedAction && (
                      <p>{t("action", { action: item.suggestedAction })}</p>
                    )}
                  </div>
                ))}
            </div>
          )}

          <Button type="button" variant="outline" className="rounded-full" onClick={onClose}>
            {t("closeSummary")}
          </Button>
        </div>
      )}
    </div>
  );
}
