"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { CmsCaseStudy } from "@/lib/cms/repositories/case-studies-repository";

export default function CaseStudiesPage() {
  const t = useTranslations("admin.caseStudies");
  const tCommon = useTranslations("admin.common");
  const [studies, setStudies] = useState<CmsCaseStudy[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/cms/case-studies");
    if (!res.ok) throw new Error(tCommon("loadFailed"));
    const data = (await res.json()) as CmsCaseStudy[];
    setStudies(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch {
        toast.error(t("loadFailed"));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    try {
      const res = await fetch(
        `/api/cms/case-studies?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(tCommon("deleteFailed"));
      await load();
      toast.success(t("deleted"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("couldNotDelete"));
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "title",
        header: t("columns.title"),
        sortable: true,
        cell: (row: CmsCaseStudy) => row.title.en,
      },
      {
        key: "country",
        header: t("columns.country"),
        cell: (row: CmsCaseStudy) => row.country,
      },
      {
        key: "industry",
        header: t("columns.industry"),
        cell: (row: CmsCaseStudy) => row.industry,
      },
      {
        key: "region",
        header: t("columns.region"),
        cell: (row: CmsCaseStudy) => (
          <span className="capitalize">{row.region}</span>
        ),
      },
      {
        key: "status",
        header: t("columns.status"),
        cell: (row: CmsCaseStudy) => (
          <Badge>
            {row.status === "draft" ||
            row.status === "published" ||
            row.status === "archived"
              ? tCommon(row.status)
              : row.status}
          </Badge>
        ),
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
              aria-label={t("deleteAria")}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [t, tCommon]
  );

  return (
    <div>
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link
            href="/admin/case-studies/new"
            className={buttonVariants({
              className:
                "gap-1.5 rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
            })}
          >
            <Plus className="size-4" />
            {t("add")}
          </Link>
        }
      />
      {loading ? null : (
        <DataTable data={studies} columns={columns} searchKey="country" />
      )}
    </div>
  );
}
