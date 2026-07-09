"use client";

import { useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { Badge } from "@/components/ui/badge";
import { getFormSubmissions } from "@/lib/cms/repositories/forms-repository";
import type { FormSubmission } from "@/lib/cms/types";

export default function QuoteFormsPage() {
  const [submissions] = useState(getFormSubmissions("quote"));

  const columns = useMemo(
    () => [
      {
        key: "company",
        header: "Company",
        cell: (row: FormSubmission) => String(row.data.company ?? "—"),
      },
      {
        key: "email",
        header: "Email",
        cell: (row: FormSubmission) => String(row.data.email ?? "—"),
      },
      {
        key: "total",
        header: "Est. Total",
        cell: (row: FormSubmission) =>
          `${row.data.currency ?? "USD"} ${row.data.total ?? 0}`,
      },
      {
        key: "status",
        header: "Status",
        cell: (row: FormSubmission) => <Badge>{row.status}</Badge>,
      },
      {
        key: "createdAt",
        header: "Date",
        cell: (row: FormSubmission) =>
          new Date(row.createdAt).toLocaleDateString(),
      },
    ],
    []
  );

  return (
    <div>
      <AdminPageHeader
        title="Quote Submissions"
        description="Review RFQ and quote requests from the marketplace."
      />
      <DataTable data={submissions} columns={columns} />
    </div>
  );
}
