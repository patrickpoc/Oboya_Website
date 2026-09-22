"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BulkValidationIssue, BulkWorkspaceRow } from "@/lib/cms/bulk-update/types";
import { BULK_FIELD_LABELS } from "@/lib/cms/bulk-update/field-labels";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: BulkWorkspaceRow[];
  issues: BulkValidationIssue[];
  onConfirm: () => void;
};

export function BulkChangeReviewDialog({
  open,
  onOpenChange,
  rows,
  issues,
  onConfirm,
}: Props) {
  const t = useTranslations("admin.products.bulk");
  const tCommon = useTranslations("admin.common");
  const withChanges = rows.filter((row) => row.changedFields.length > 0);
  const fieldsChanged = withChanges.reduce(
    (sum, row) => sum + row.changedFields.length,
    0
  );
  const blocked = issues.filter((issue) => issue.status === "blocked");
  const warnings = issues.filter((issue) => issue.status === "warning");
  const canApply = blocked.length === 0 && withChanges.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("reviewTitle")}</DialogTitle>
          <DialogDescription>{t("reviewDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3">
            <p>{t("productsSelected", { count: rows.length })}</p>
            <p>{t("productsWithChanges", { count: withChanges.length })}</p>
            <p>{t("fieldsChanged", { count: fieldsChanged })}</p>
            <p>
              {t("validWarningsBlocked")}{" "}
              <strong>
                {Math.max(0, fieldsChanged - blocked.length - warnings.length)} /{" "}
                {warnings.length} / {blocked.length}
              </strong>
            </p>
          </div>

          {blocked.length > 0 && (
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <p className="font-semibold">{t("blockedMustFix")}</p>
              {blocked.map((issue) => (
                <div key={`${issue.productId}-${issue.field}-${issue.message}`}>
                  <p>
                    {issue.sku} · {BULK_FIELD_LABELS[issue.field] ?? issue.field}
                  </p>
                  <p>{issue.message}</p>
                  <p className="text-red-700/80">{issue.suggestedAction}</p>
                </div>
              ))}
            </div>
          )}

          {warnings.length > 0 && blocked.length === 0 && (
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-semibold">{t("warningsAllowed")}</p>
              {warnings.map((issue) => (
                <p key={`${issue.productId}-${issue.field}-${issue.message}`}>
                  {issue.sku}: {issue.message}
                </p>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            disabled={!canApply}
            className="bg-oboya-green text-white hover:bg-oboya-green/90"
            onClick={onConfirm}
          >
            {t("confirmApply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
