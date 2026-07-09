"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getCaseStudies } from "@/lib/cms/repositories/case-studies-repository";

export default function CaseStudiesPage() {
  const [studies] = useState(getCaseStudies());

  const columns = useMemo(
    () => [
      {
        key: "title",
        header: "Title",
        sortable: true,
        cell: (row: (typeof studies)[0]) => row.title.en,
      },
      { key: "country", header: "Country", cell: (row: (typeof studies)[0]) => row.country },
      { key: "industry", header: "Industry", cell: (row: (typeof studies)[0]) => row.industry },
      {
        key: "status",
        header: "Status",
        cell: (row: (typeof studies)[0]) => (
          <Badge>{row.status}</Badge>
        ),
      },
      {
        key: "actions",
        header: "",
        cell: (row: (typeof studies)[0]) => (
          <Link href={`/admin/case-studies/${row.id}`} className="rounded p-1 hover:bg-muted">
            <Pencil className="size-3.5" />
          </Link>
        ),
      },
    ],
    []
  );

  return (
    <div>
      <AdminPageHeader
        title="Case Studies"
        description="Manage success stories with challenge, solution and results."
        actions={
          <Link
            href="/admin/case-studies/new"
            className={buttonVariants({
              className: "gap-1.5 rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
            })}
          >
            <Plus className="size-4" />
            New case study
          </Link>
        }
      />
      <DataTable data={studies} columns={columns} searchKey="country" />
    </div>
  );
}
