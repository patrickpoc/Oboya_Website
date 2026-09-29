"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { EntityAvatar, FilterBar, FilterSelect, StatusPill, useUrlFilters } from "@/components/admin/common";
import type { AuditLogEntry } from "@/lib/cms/types";
import { toast } from "sonner";

export default function AuditLogsPage() {
  const t = useTranslations("admin.audit");
  const tCommon = useTranslations("admin.common");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { filters, setFilters, reset } = useUrlFilters({ user: "", module: "", from: "", to: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/cms/audit-logs");
        if (!res.ok) throw new Error(tCommon("loadFailed"));
        const data = (await res.json()) as AuditLogEntry[];
        setLogs(Array.isArray(data) ? data : []);
      } catch {
        toast.error(t("loadFailed"));
        setError(t("loadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, [t, tCommon]);

  const users = useMemo(
    () => [...new Set(logs.map((l) => l.userName))].sort().map((value) => ({ value, label: value })),
    [logs]
  );
  const modules = useMemo(
    () => [...new Set(logs.map((l) => l.module))].sort().map((value) => ({ value, label: value })),
    [logs]
  );
  const filtered = useMemo(
    () =>
      logs.filter((row) => {
        if (filters.user && row.userName !== filters.user) return false;
        if (filters.module && row.module !== filters.module) return false;
        if (filters.from && row.createdAt < filters.from) return false;
        if (filters.to && row.createdAt.slice(0, 10) > filters.to) return false;
        return true;
      }),
    [logs, filters]
  );

  const columns = useMemo(
    () => [
      {
        key: "userName",
        header: tCommon("user"),
        cell: (r: AuditLogEntry) => (
          <span className="inline-flex items-center gap-2">
            <EntityAvatar name={r.userName} size="sm" />
            {r.userName}
          </span>
        ),
      },
      {
        key: "action",
        header: tCommon("action"),
        cell: (r: AuditLogEntry) => <StatusPill tone="brand">{r.action}</StatusPill>,
      },
      {
        key: "module",
        header: tCommon("module"),
        cell: (r: AuditLogEntry) => <StatusPill tone="neutral">{r.module}</StatusPill>,
      },
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
      <FilterBar
        className="mb-4"
        showReset={Boolean(filters.user || filters.module || filters.from || filters.to)}
        onReset={reset}
      >
        <FilterSelect label={tCommon("user")} value={filters.user} onChange={(user) => setFilters({ user })} options={users} />
        <FilterSelect label={tCommon("module")} value={filters.module} onChange={(module) => setFilters({ module })} options={modules} />
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {tCommon("date")}
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ from: e.target.value })}
            className="h-8 rounded-md border border-border/70 bg-white px-2 text-xs"
          />
        </label>
      </FilterBar>
      <DataTable data={filtered} columns={columns} searchKey="userName" loading={loading} error={error} />
    </div>
  );
}
