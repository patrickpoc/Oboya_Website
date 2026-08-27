"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { CmsCaseStudy } from "@/lib/cms/repositories/case-studies-repository";

export default function CaseStudiesPage() {
  const [studies, setStudies] = useState<CmsCaseStudy[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/cms/case-studies");
    if (!res.ok) throw new Error("Failed to load case studies");
    const data = (await res.json()) as CmsCaseStudy[];
    setStudies(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch {
        toast.error("Could not load case studies");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this case study?")) return;
    try {
      const res = await fetch(
        `/api/cms/case-studies?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Delete failed");
      await load();
      toast.success("Case study deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete");
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "title",
        header: "Title",
        sortable: true,
        cell: (row: CmsCaseStudy) => row.title.en,
      },
      {
        key: "country",
        header: "Country",
        cell: (row: CmsCaseStudy) => row.country,
      },
      {
        key: "industry",
        header: "Industry",
        cell: (row: CmsCaseStudy) => row.industry,
      },
      {
        key: "region",
        header: "Region",
        cell: (row: CmsCaseStudy) => (
          <span className="capitalize">{row.region}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (row: CmsCaseStudy) => <Badge>{row.status}</Badge>,
      },
      {
        key: "actions",
        header: "",
        cell: (row: CmsCaseStudy) => (
          <div className="flex items-center gap-1">
            <Link
              href={`/admin/case-studies/${row.id}`}
              className="rounded p-1 hover:bg-muted"
            >
              <Pencil className="size-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => void handleDelete(row.id)}
              className="rounded p-1 text-destructive hover:bg-muted"
              aria-label="Delete case study"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
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
              className:
                "gap-1.5 rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
            })}
          >
            <Plus className="size-4" />
            New case study
          </Link>
        }
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <DataTable data={studies} columns={columns} searchKey="country" />
      )}
    </div>
  );
}
