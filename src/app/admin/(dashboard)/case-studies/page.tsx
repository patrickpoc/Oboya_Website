"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  deleteCaseStudy,
  getCaseStudies,
} from "@/lib/cms/repositories/case-studies-repository";

export default function CaseStudiesPage() {
  const [studies, setStudies] = useState(getCaseStudies());

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this case study?")) return;
    deleteCaseStudy(id);
    setStudies([...getCaseStudies()]);
    toast.success("Case study deleted");
  };

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
        key: "region",
        header: "Region",
        cell: (row: (typeof studies)[0]) => (
          <span className="capitalize">{row.region}</span>
        ),
      },
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
          <div className="flex items-center gap-1">
            <Link href={`/admin/case-studies/${row.id}`} className="rounded p-1 hover:bg-muted">
              <Pencil className="size-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(row.id)}
              className="rounded p-1 text-destructive hover:bg-muted"
              aria-label="Delete case study"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [studies]
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
