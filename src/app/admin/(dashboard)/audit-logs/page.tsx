"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import type { AuditLogEntry } from "@/lib/cms/types";
import { toast } from "sonner";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/cms/audit-logs");
        if (!res.ok) throw new Error("Failed to load");
        const data = (await res.json()) as AuditLogEntry[];
        setLogs(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Could not load audit logs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns = useMemo(
    () => [
      { key: "userName", header: "User", cell: (r: AuditLogEntry) => r.userName },
      { key: "action", header: "Action", cell: (r: AuditLogEntry) => r.action },
      { key: "module", header: "Module", cell: (r: AuditLogEntry) => r.module },
      {
        key: "details",
        header: "Details",
        cell: (r: AuditLogEntry) => r.details ?? "—",
      },
      {
        key: "createdAt",
        header: "Date",
        sortable: true,
        cell: (r: AuditLogEntry) => new Date(r.createdAt).toLocaleString(),
      },
    ],
    []
  );

  return (
    <div>
      <AdminPageHeader
        title="Audit Logs"
        description="Track administrative actions across the system."
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <DataTable data={logs} columns={columns} searchKey="userName" />
      )}
    </div>
  );
}
