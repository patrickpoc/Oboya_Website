"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { Badge } from "@/components/ui/badge";
import {
  getFormSubmissions,
  updateSubmissionStatus,
} from "@/lib/cms/repositories/forms-repository";
import type { FormSubmission } from "@/lib/cms/types";

export default function ContactFormsPage() {
  const [submissions, setSubmissions] = useState(
    getFormSubmissions("contact")
  );

  const handleStatus = (id: string, status: FormSubmission["status"]) => {
    updateSubmissionStatus(id, status);
    setSubmissions(getFormSubmissions("contact"));
    toast.success("Status updated");
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        cell: (row: FormSubmission) => String(row.data.name ?? "—"),
      },
      {
        key: "email",
        header: "Email",
        cell: (row: FormSubmission) => String(row.data.email ?? "—"),
      },
      {
        key: "status",
        header: "Status",
        cell: (row: FormSubmission) => (
          <Badge variant={row.status === "new" ? "default" : "secondary"}>
            {row.status}
          </Badge>
        ),
      },
      {
        key: "createdAt",
        header: "Date",
        sortable: true,
        cell: (row: FormSubmission) =>
          new Date(row.createdAt).toLocaleDateString(),
      },
      {
        key: "actions",
        header: "",
        cell: (row: FormSubmission) => (
          <select
            value={row.status}
            onChange={(e) =>
              handleStatus(row.id, e.target.value as FormSubmission["status"])
            }
            className="h-7 rounded border border-input px-1 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>
        ),
      },
    ],
    []
  );

  return (
    <div>
      <AdminPageHeader
        title="Contact Submissions"
        description="Review and manage contact form submissions."
      />
      <DataTable
        data={submissions}
        columns={columns}
        searchKey="createdAt"
        emptyMessage="No contact submissions yet."
      />
    </div>
  );
}
