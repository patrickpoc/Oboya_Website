"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ImportValidationIssue, ImportWorkspaceRow } from "@/lib/cms/bulk-import/types";

type Props = {
  open: boolean;
  rows: ImportWorkspaceRow[];
  issues: ImportValidationIssue[];
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function BulkImportReviewDialog({ open, rows, issues, onOpenChange, onConfirm }: Props) {
  const t = useTranslations("admin.products.bulkImport");
  const blocked = useMemo(
    () => issues.filter((issue) => issue.status === "blocked"),
    [issues]
  );
  const warnings = useMemo(
    () => issues.filter((issue) => issue.status === "warning"),
    [issues]
  );
  const blockedIds = useMemo(
    () => new Set(blocked.map((issue) => issue.productId)),
    [blocked]
  );
  const readyCount = rows.filter((row) => !blockedIds.has(row.productId)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("reviewTitle")}</DialogTitle>
          <DialogDescription>{t("reviewDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              <p className="text-xs text-muted-foreground">{t("readyToCreate")}</p>
              <p className="text-lg font-semibold text-oboya-blue-dark">{readyCount}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs text-amber-800">{t("warnings")}</p>
              <p className="text-lg font-semibold text-amber-900">{warnings.length}</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-xs text-red-800">{t("blocked")}</p>
              <p className="text-lg font-semibold text-red-900">{blocked.length}</p>
            </div>
          </div>

          {blocked.length > 0 && (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <p className="font-semibold">{t("blockedListTitle")}</p>
              {blocked.map((issue) => (
                <p key={`${issue.productId}-${issue.field}-${issue.message}`}>
                  {issue.sku || issue.productId} · {issue.field}: {issue.message}
                </p>
              ))}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-semibold">{t("warningListTitle")}</p>
              {warnings.map((issue) => (
                <p key={`${issue.productId}-${issue.field}-${issue.message}`}>
                  {issue.sku || issue.productId} · {issue.field}: {issue.message}
                </p>
              ))}
            </div>
          )}

          {blocked.length > 0 ? (
            <p className="text-sm text-red-700">{t("fixBlockedBeforeImport")}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("confirmCreateHint", { count: readyCount })}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("backToEdit")}
          </Button>
          <Button
            type="button"
            disabled={blocked.length > 0 || readyCount === 0}
            className="bg-oboya-green text-white hover:bg-oboya-green/90"
            onClick={onConfirm}
          >
            {t("confirmImport", { count: readyCount })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
