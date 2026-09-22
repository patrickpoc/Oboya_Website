"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import type { AuditLogEntry } from "@/lib/cms/types";
import { toast } from "sonner";

export default function AuditLogsPage() {
  const t = useTranslations("admin.audit");
  const tCommon = useTranslations("admin.common");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/cms/audit-logs");
        if (!res.ok) throw new Error(tCommon("loadFailed"));
        const data = (await res.json()) as AuditLogEntry[];
        setLogs(Array.isArray(data) ? data : []);
      } catch {
        toast.error(t("loadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, [t, tCommon]);

  const columns = useMemo(
    () => [
      { key: "userName", header: tCommon("user"), cell: (r: AuditLogEntry) => r.userName },
      { key: "action", header: tCommon("action"), cell: (r: AuditLogEntry) => r.action },
      { key: "module", header: tCommon("module"), cell: (r: AuditLogEntry) => r.module },
      {
        key: "details",
        header: tCommon("details"),
        cell: (r: AuditLogEntry) => r.details ?? "—",
      },
      {
        key: "createdAt",
        header: tCommon("date"),
        sortable: true,
        cell: (r: AuditLogEntry) => new Date(r.createdAt).toLocaleString(),
      },
    ],
    [tCommon]
  );

  return (
    <div>
      <AdminPageHeader title={t("title")} description={t("description")} />
      {loading ? null : (
        <DataTable data={logs} columns={columns} searchKey="userName" />
      )}
    </div>
  );
}
