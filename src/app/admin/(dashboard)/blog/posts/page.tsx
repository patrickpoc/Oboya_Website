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
import type { CmsBlogPost } from "@/lib/cms/repositories/blog-repository";

export default function BlogPostsPage() {
  const t = useTranslations("admin.blog.posts");
  const tCommon = useTranslations("admin.common");
  const [posts, setPosts] = useState<CmsBlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/cms/blog-posts");
    if (!res.ok) throw new Error(tCommon("loadFailed"));
    const data = (await res.json()) as CmsBlogPost[];
    setPosts(Array.isArray(data) ? data : []);
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
      const res = await fetch(`/api/cms/blog-posts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
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
        cell: (row: (typeof posts)[0]) => row.title.en || row.slug,
      },
      { key: "author", header: t("columns.author"), cell: (row: (typeof posts)[0]) => row.author },
      {
        key: "status",
        header: t("columns.status"),
        cell: (row: (typeof posts)[0]) => (
          <Badge variant={row.status === "published" ? "default" : "secondary"}>
            {row.status}
          </Badge>
        ),
      },
      {
        key: "publishedAt",
        header: t("columns.published"),
        cell: (row: (typeof posts)[0]) => row.publishedAt?.slice(0, 10) ?? "—",
      },
      {
        key: "actions",
        header: "",
        cell: (row: (typeof posts)[0]) => (
          <div className="flex items-center gap-1">
            <Link
              href={`/admin/blog/posts/${row.id}`}
              className="inline-flex rounded p-1 hover:bg-muted"
              aria-label={t("editAria", { title: row.title.en || row.slug })}
            >
              <Pencil className="size-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(row.id)}
              className="inline-flex rounded p-1 text-destructive hover:bg-muted"
              aria-label={t("deleteAria", { title: row.title.en || row.slug })}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [posts, t]
  );

  return (
    <div>
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link
            href="/admin/blog/posts/new"
            className={buttonVariants({
              className: "gap-1.5 rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
            })}
          >
            <Plus className="size-4" />
            {t("addPost")}
          </Link>
        }
      />
      {loading ? null : (
        <DataTable data={posts} columns={columns} searchKey="slug" />
      )}
    </div>
  );
}
