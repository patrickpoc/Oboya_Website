"use client";

import { useMemo } from "react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { getAuditLogs } from "@/lib/cms/repositories/users-repository";

export default function AuditLogsPage() {
  const logs = getAuditLogs();

  const columns = useMemo(
    () => [
      { key: "userName", header: "User", cell: (r: (typeof logs)[0]) => r.userName },
      { key: "action", header: "Action", cell: (r: (typeof logs)[0]) => r.action },
      { key: "module", header: "Module", cell: (r: (typeof logs)[0]) => r.module },
      { key: "details", header: "Details", cell: (r: (typeof logs)[0]) => r.details ?? "—" },
      {
        key: "createdAt",
        header: "Date",
        sortable: true,
        cell: (r: (typeof logs)[0]) => new Date(r.createdAt).toLocaleString(),
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
      <DataTable data={logs} columns={columns} searchKey="userName" />
    </div>
  );
}
