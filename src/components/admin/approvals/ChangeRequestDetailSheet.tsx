"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { ChangeDiffEntry, ChangeRequest } from "@/lib/cms/approvals/types";
import { changeTypeLabelKey } from "@/lib/cms/approvals/change-types";
import { DiffTable, StatusPill, formatDateTime } from "@/components/admin/approvals/shared";
import { RejectDialog } from "@/components/admin/approvals/RejectDialog";
import { useChangeRequestActions } from "@/components/admin/approvals/use-change-request-actions";

type Detail = {
  item: ChangeRequest;
  currentDiff?: ChangeDiffEntry[];
  canReview: boolean;
  canCancel: boolean;
  requireRejectComment: boolean;
};

const OPEN = new Set(["pending", "in_review", "conflict"]);

export function ChangeRequestDetailSheet({
  requestId,
  onOpenChange,
  onChanged,
}: {
  requestId: string | null;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}) {
  const t = useTranslations("admin.approvals");
  const locale = useLocale();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const { review, cancel, busyId } = useChangeRequestActions(() => {
    setReloadKey((k) => k + 1);
    onChanged?.();
  });

  useEffect(() => {
    if (!requestId) return;
    let cancelled = false;
    fetch(`/api/cms/change-requests/${requestId}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as Detail & { error?: string };
        if (!cancelled && res.ok) setDetail(data);
      })
      .catch(() => {
        // Sheet stays in its loading state; the list remains usable.
      });
    return () => {
      cancelled = true;
    };
  }, [requestId, reloadKey]);

  const item = detail && detail.item.id === requestId ? detail.item : undefined;
  const loading = Boolean(requestId) && !item;
  const busy = Boolean(item && busyId === item.id);
  const open = Boolean(item && OPEN.has(item.status));

  return (
    <Sheet open={Boolean(requestId)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{t("detail.title")}</SheetTitle>
          {item ? (
            <SheetDescription>
              {t(`types.${changeTypeLabelKey(item.changeType)}`)} · {item.entityLabel}
            </SheetDescription>
          ) : null}
        </SheetHeader>

        {loading ? (
          <p className="px-4 text-sm text-muted-foreground">{t("detail.loading")}</p>
        ) : null}

        {item ? (
          <div className="space-y-5 px-4 pb-6">
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-muted-foreground">{t("fields.requestedBy")}</dt>
                <dd className="font-medium text-oboya-blue-dark">{item.requestedByName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("fields.requestedAt")}</dt>
                <dd className="font-medium text-oboya-blue-dark">
                  {formatDateTime(item.requestedAt, locale)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("fields.action")}</dt>
                <dd className="font-medium text-oboya-blue-dark">
                  {t(`actionLabel.${item.action}`)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("fields.status")}</dt>
                <dd>
                  <StatusPill status={item.status} />
                </dd>
              </div>
              {item.reviewerName || item.inReviewByName ? (
                <div className="col-span-2">
                  <dt className="text-muted-foreground">{t("fields.reviewer")}</dt>
                  <dd className="font-medium text-oboya-blue-dark">
                    {item.reviewerName || item.inReviewByName}
                    {item.reviewedAt ? ` · ${formatDateTime(item.reviewedAt, locale)}` : ""}
                  </dd>
                </div>
              ) : null}
              {item.reviewComment ? (
                <div className="col-span-2">
                  <dt className="text-muted-foreground">{t("fields.comment")}</dt>
                  <dd className="whitespace-pre-wrap text-oboya-blue-dark">{item.reviewComment}</dd>
                </div>
              ) : null}
            </dl>

            {item.summary ? (
              <div>
                <p className="mb-1 text-xs font-semibold text-oboya-blue-dark">{t("fields.summary")}</p>
                <p className="text-sm text-oboya-blue-dark">{item.summary}</p>
              </div>
            ) : null}

            {item.status === "conflict" ? (
              <div className="rounded-lg border border-oboya-yellow-dark/40 bg-oboya-yellow-light/30 p-3 text-xs text-oboya-blue-dark">
                <p className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="size-3.5" /> {t("detail.conflictTitle")}
                </p>
                <p className="mt-1">{t("detail.conflictDescription")}</p>
                {item.diff.conflicts?.length ? (
                  <p className="mt-1 font-mono">{item.diff.conflicts.join(", ")}</p>
                ) : null}
                {detail?.currentDiff && detail.currentDiff.length > 0 ? (
                  <div className="mt-3">
                    <DiffTable
                      entries={detail.currentDiff}
                      beforeLabel={t("detail.current")}
                      afterLabel={t("detail.proposed")}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {item.applyError ? (
              <p className="rounded-lg bg-oboya-orange/10 p-3 text-xs text-oboya-orange">
                {t("detail.applyError")}: {item.applyError}
              </p>
            ) : null}

            {item.diff.items?.length ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-oboya-blue-dark">
                  {t("detail.bulkItems", { count: item.diff.items.length })}
                </p>
                {item.diff.items.map((bulkItem) => (
                  <div key={bulkItem.productId} className="space-y-1.5">
                    <p className="text-xs font-medium text-oboya-blue-dark">
                      <span className="font-mono">{bulkItem.sku}</span> · {bulkItem.name}
                      {bulkItem.result ? (
                        <span className="ml-2 text-muted-foreground">({bulkItem.result})</span>
                      ) : null}
                    </p>
                    <DiffTable entries={bulkItem.changes} max={20} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-oboya-blue-dark">{t("fields.change")}</p>
                <DiffTable entries={item.diff.entries} />
              </div>
            )}

            {open && (detail?.canReview || detail?.canCancel) ? (
              <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                {detail?.canReview ? (
                  <>
                    <Button
                      className="rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
                      disabled={busy}
                      onClick={() => void review(item.id, "approve")}
                    >
                      {t("actions.approve")}
                    </Button>
                    {item.status === "conflict" ? (
                      <Button
                        variant="outline"
                        className="rounded-full border-oboya-yellow-dark text-oboya-blue-dark"
                        disabled={busy}
                        onClick={() => void review(item.id, "approve", { force: true })}
                      >
                        {t("actions.forceApply")}
                      </Button>
                    ) : null}
                    {item.status !== "in_review" ? (
                      <Button
                        variant="outline"
                        className="rounded-full border-oboya-blue-light text-oboya-blue"
                        disabled={busy}
                        onClick={() => void review(item.id, "in_review")}
                      >
                        {t("actions.inReview")}
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      className="rounded-full border-oboya-orange text-oboya-orange"
                      disabled={busy}
                      onClick={() => setRejectOpen(true)}
                    >
                      {t("actions.reject")}
                    </Button>
                  </>
                ) : null}
                {detail?.canCancel ? (
                  <Button
                    variant="ghost"
                    className="rounded-full"
                    disabled={busy}
                    onClick={() => void cancel(item.id)}
                  >
                    {t("actions.cancel")}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <RejectDialog
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          requireComment={detail?.requireRejectComment ?? true}
          busy={busy}
          onConfirm={(comment) => {
            setRejectOpen(false);
            if (item) void review(item.id, "reject", { comment });
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
