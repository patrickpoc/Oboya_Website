"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type BulkQueueItemStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "skipped";

export type BulkQueueItem = {
  id: string;
  sku: string;
  name: string;
  status: BulkQueueItemStatus;
  error?: string;
};

type Props = {
  /** i18n namespace: admin.products.bulkImport | admin.products.bulk */
  namespace: "admin.products.bulkImport" | "admin.products.bulk";
  items: BulkQueueItem[];
  running: boolean;
  onClear?: () => void;
};

const STATUS_CLASS: Record<BulkQueueItemStatus, string> = {
  pending: "bg-oboya-soft-white text-oboya-blue-dark",
  running: "bg-oboya-blue-light/15 text-oboya-blue",
  success: "bg-oboya-green/15 text-oboya-green",
  failed: "bg-oboya-orange/15 text-oboya-orange",
  skipped: "bg-muted text-muted-foreground",
};

export function BulkExecutionQueue({
  namespace,
  items,
  running,
  onClear,
}: Props) {
  const t = useTranslations(namespace);
  if (items.length === 0) return null;

  const done =
    !running &&
    items.every((item) => item.status !== "pending" && item.status !== "running");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-oboya-blue-dark">
          {t("executionQueue", { count: items.length })}
          {running && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {t("executionQueueRunning")}
            </span>
          )}
        </p>
        {done && onClear && (
          <button
            type="button"
            className="text-xs font-medium text-oboya-blue-light hover:underline"
            onClick={onClear}
          >
            {t("clearExecutionQueue")}
          </button>
        )}
      </div>
      <ul className="max-h-72 divide-y divide-border/50 overflow-y-auto rounded-xl border border-border/60 bg-white">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5 text-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-oboya-blue-dark">
                {item.name}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {t("skuLabel", { sku: item.sku })}
              </p>
              {item.status === "failed" && item.error && (
                <p className="mt-1 text-xs text-oboya-orange">{item.error}</p>
              )}
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                STATUS_CLASS[item.status]
              )}
            >
              {item.status === "running" && (
                <span className="size-3 animate-spin rounded-full border-2 border-current/25 border-t-current" />
              )}
              {t(`queueStatus.${item.status}`)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
