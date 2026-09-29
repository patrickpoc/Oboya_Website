"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { APPROVALS_CHANGED_EVENT } from "@/lib/cms/approvals/client";
import { changeTypeLabelKey } from "@/lib/cms/approvals/change-types";
import type { ChangeRequest } from "@/lib/cms/approvals/types";

export function PendingChangeBanner({
  entityType,
  entityId,
}: {
  entityType: string;
  entityId: string;
}) {
  const t = useTranslations("admin.approvals");
  const [items, setItems] = useState<ChangeRequest[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      const params = new URLSearchParams({ scope: "entity", entityType, entityId });
      fetch(`/api/cms/change-requests?${params}`, { cache: "no-store" })
        .then((res) => (res.ok ? (res.json() as Promise<{ items?: ChangeRequest[] }>) : null))
        .then((data) => {
          if (data && !cancelled) setItems(data.items ?? []);
        })
        .catch(() => {
          // Banner is informational only.
        });
    };
    load();
    window.addEventListener(APPROVALS_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(APPROVALS_CHANGED_EVENT, load);
    };
  }, [entityType, entityId]);

  if (items.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-oboya-blue-light/40 bg-oboya-blue-light/10 p-4 text-sm text-oboya-blue-dark">
      <div className="flex items-start gap-3">
        <Clock className="mt-0.5 size-4 shrink-0 text-oboya-blue-light" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold">{t("banner.title", { count: items.length })}</p>
          <ul className="space-y-0.5">
            {items.map((item) => (
              <li key={item.id} className="truncate">
                <span className="font-medium">
                  {t(`types.${changeTypeLabelKey(item.changeType)}`)}
                </span>
                {" · "}
                {t(`status.${item.status}`)}
                {" · "}
                {t("banner.by", { name: item.requestedByName })}
                {item.summary ? ` · ${item.summary}` : ""}
              </li>
            ))}
          </ul>
          <Link href="/admin/approvals/mine" className="text-xs font-medium text-oboya-blue underline">
            {t("banner.viewMine")}
          </Link>
        </div>
      </div>
    </div>
  );
}
