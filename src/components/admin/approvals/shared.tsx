"use client";

import { useTranslations } from "next-intl";
import type { CmsModule } from "@/lib/cms/types";
import type { ChangeDiffEntry, ChangeRequestStatus } from "@/lib/cms/approvals/types";
import { formatDiffValue } from "@/lib/cms/approvals/diff";
import { StatusPill as CommonStatusPill, type PillTone } from "@/components/admin/common/StatusPill";

export const MODULE_NAV_KEYS: Partial<Record<CmsModule, string>> = {
  dashboard: "dashboard",
  website: "website",
  marketplace: "marketplace",
  global_presence: "globalPresence",
  blog: "blog",
  case_studies: "caseStudies",
  careers: "careers",
  media: "mediaLibrary",
  forms: "formsLeads",
  users: "users",
  settings: "settings",
  audit_logs: "auditLogs",
  analytics: "analytics",
};

const STATUS_TONES: Record<ChangeRequestStatus, PillTone> = {
  pending: "warning",
  in_review: "info",
  approved: "success",
  rejected: "danger",
  conflict: "highlight",
  failed: "danger",
  cancelled: "muted",
  superseded: "muted",
};

export function StatusPill({ status }: { status: ChangeRequestStatus }) {
  const t = useTranslations("admin.approvals.status");
  return <CommonStatusPill tone={STATUS_TONES[status]}>{t(status)}</CommonStatusPill>;
}

export function DiffTable({
  entries,
  beforeLabel,
  afterLabel,
  max = 50,
}: {
  entries: ChangeDiffEntry[];
  beforeLabel?: string;
  afterLabel?: string;
  max?: number;
}) {
  const t = useTranslations("admin.approvals.detail");
  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground">{t("noChanges")}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full text-xs">
        <thead className="bg-oboya-soft-white text-left text-muted-foreground">
          <tr>
            <th className="px-2 py-1.5 font-medium">{t("path")}</th>
            <th className="px-2 py-1.5 font-medium">{beforeLabel ?? t("before")}</th>
            <th className="px-2 py-1.5 font-medium">{afterLabel ?? t("after")}</th>
          </tr>
        </thead>
        <tbody>
          {entries.slice(0, max).map((entry) => (
            <tr key={entry.path} className="border-t border-border/40 align-top">
              <td className="px-2 py-1.5 font-mono text-[11px] text-oboya-blue-dark">{entry.path}</td>
              <td className="px-2 py-1.5 text-muted-foreground line-through decoration-oboya-orange/60">
                {formatDiffValue(entry.before)}
              </td>
              <td className="px-2 py-1.5 font-medium text-oboya-blue-dark">
                {formatDiffValue(entry.after)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {entries.length > max ? (
        <p className="border-t border-border/40 px-2 py-1 text-[11px] text-muted-foreground">
          {t("moreChanges", { count: entries.length - max })}
        </p>
      ) : null}
    </div>
  );
}

export function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
