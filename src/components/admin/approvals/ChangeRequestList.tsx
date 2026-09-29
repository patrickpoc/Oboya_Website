"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChangeRequest } from "@/lib/cms/approvals/types";
import { APPROVALS_CHANGED_EVENT } from "@/lib/cms/approvals/client";
import { changeTypeLabelKey } from "@/lib/cms/approvals/change-types";
import { StatusPill, formatDateTime } from "@/components/admin/approvals/shared";
import { RejectDialog } from "@/components/admin/approvals/RejectDialog";
import { ChangeRequestDetailSheet } from "@/components/admin/approvals/ChangeRequestDetailSheet";
import { useChangeRequestActions } from "@/components/admin/approvals/use-change-request-actions";
import { cn } from "@/lib/utils";

export type ChangeRequestListMode = "review" | "mine" | "all";

const OPEN = new Set(["pending", "in_review", "conflict"]);

export function ChangeRequestList({
  mode,
  status = "open",
  module,
  limit,
  compact,
  emptyLabel,
}: {
  mode: ChangeRequestListMode;
  status?: string;
  module?: string;
  limit?: number;
  compact?: boolean;
  emptyLabel?: string;
}) {
  const t = useTranslations("admin.approvals");
  const locale = useLocale();
  const [items, setItems] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ChangeRequest | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ scope: mode });
    if (status) params.set("status", status);
    if (module) params.set("module", module);
    const load = () => {
      fetch(`/api/cms/change-requests?${params.toString()}`, { cache: "no-store" })
        .then(async (res) => {
          const data = (await res.json()) as { items?: ChangeRequest[]; error?: string };
          if (!res.ok) throw new Error(data.error || t("loadFailed"));
          return data.items ?? [];
        })
        .then((next) => {
          if (cancelled) return;
          setItems(limit ? next.slice(0, limit) : next);
          setError(null);
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(err instanceof Error ? err.message : t("loadFailed"));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    load();
    window.addEventListener(APPROVALS_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(APPROVALS_CHANGED_EVENT, load);
    };
  }, [mode, status, module, limit, t]);

  const { review, cancel, busyId } = useChangeRequestActions();

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> {t("detail.loading")}
      </div>
    );
  }

  if (error) {
    return <p className="py-6 text-sm text-oboya-orange">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 py-8 text-center text-sm text-muted-foreground">
        {emptyLabel ?? (mode === "mine" ? t("emptyMine") : t("empty"))}
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/60 bg-white">
        {items.map((item) => {
          const busy = busyId === item.id;
          const isOpen = OPEN.has(item.status);
          return (
            <li
              key={item.id}
              className={cn(
                "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center",
                compact && "py-2.5"
              )}
            >
              <button
                type="button"
                onClick={() => setDetailId(item.id)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={item.status} />
                  <span className="text-xs font-semibold text-oboya-blue">
                    {t(`types.${changeTypeLabelKey(item.changeType)}`)}
                  </span>
                  <span className="truncate text-sm font-medium text-oboya-blue-dark">
                    {item.entityLabel}
                  </span>
                </div>
                {item.summary ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.summary}</p>
                ) : null}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {mode === "mine"
                    ? formatDateTime(item.requestedAt, locale)
                    : t("fields.byOn", {
                        name: item.requestedByName,
                        date: formatDateTime(item.requestedAt, locale),
                      })}
                  {item.reviewComment && !isOpen ? ` · “${item.reviewComment}”` : ""}
                </p>
              </button>

              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                {mode === "review" && isOpen ? (
                  <>
                    {item.status !== "conflict" ? (
                      <Button
                        size="sm"
                        className="h-7 rounded-full bg-oboya-green px-3 text-xs text-white hover:bg-oboya-green/90"
                        disabled={busy}
                        onClick={() => void review(item.id, "approve")}
                      >
                        {t("actions.approve")}
                      </Button>
                    ) : null}
                    {item.status === "pending" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-full border-oboya-blue-light px-3 text-xs text-oboya-blue"
                        disabled={busy}
                        onClick={() => void review(item.id, "in_review")}
                      >
                        {t("actions.inReview")}
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-full border-oboya-orange px-3 text-xs text-oboya-orange"
                      disabled={busy}
                      onClick={() => setRejectTarget(item)}
                    >
                      {t("actions.reject")}
                    </Button>
                  </>
                ) : null}
                {(mode === "mine" || mode === "all") && isOpen ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-full px-3 text-xs"
                    disabled={busy}
                    onClick={() => void cancel(item.id)}
                  >
                    {t("actions.cancel")}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 rounded-full px-3 text-xs"
                  onClick={() => setDetailId(item.id)}
                >
                  {t("actions.details")}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <RejectDialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        requireComment
        busy={Boolean(rejectTarget && busyId === rejectTarget.id)}
        onConfirm={(comment) => {
          const target = rejectTarget;
          setRejectTarget(null);
          if (target) void review(target.id, "reject", { comment });
        }}
      />

      <ChangeRequestDetailSheet
        requestId={detailId}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
      />
    </>
  );
}
