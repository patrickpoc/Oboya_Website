"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { SequentialApplyProgress } from "@/lib/cms/bulk-update/apply-sequential";
import { displayProductName } from "@/lib/cms/bulk-update/search-products";
import type { BulkApplyResult } from "@/lib/cms/bulk-update/types";

type Props = {
  running: boolean;
  progress: SequentialApplyProgress | null;
  results: BulkApplyResult[] | null;
  onClose: () => void;
};

export function BulkUpdateProgress({ running, progress, results, onClose }: Props) {
  const t = useTranslations("admin.products.bulk");
  if (!running && !results) return null;

  const success = results?.filter((item) => item.status === "SUCCESS").length ?? 0;
  const failed = results?.filter((item) => item.status === "FAILED").length ?? 0;
  const skipped = results?.filter((item) => item.status === "SKIPPED").length ?? 0;

  return (
    <div className="rounded-xl border border-border/60 bg-white p-4">
      {running && progress && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="size-8 animate-spin rounded-full border-2 border-oboya-green/25 border-t-oboya-green" />
            <div>
              <p className="text-sm font-semibold text-oboya-blue-dark">{t("updating")}</p>
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
            <p className="text-sm text-emerald-700">{t("updatedOk")}</p>
          )}
          {progress.lastResult?.status === "FAILED" && (
            <p className="text-sm text-red-700">{t("failedWithError", { error: progress.lastResult.error ?? "" })}</p>
          )}
        </div>
      )}

      {!running && results && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-oboya-blue-dark">
            {t("processed", { count: results.length })}
          </p>
          <p className="text-sm">
            {t("resultSummary", { success, failed, skipped })}
          </p>

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
                    {item.suggestedAction && <p>{t("action", { action: item.suggestedAction })}</p>}
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
