"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { ListSkeleton, MasterDetailLayout } from "@/components/admin/common";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/admin/permissions/Can";
import type { BlogAuthor } from "@/lib/cms/repositories/blog-authors-repository";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";

export default function BlogAuthorsPage() {
  const t = useTranslations("admin.blog.authors");
  const tCommon = useTranslations("admin.common");
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/cms/blog-authors");
    if (!res.ok) throw new Error(tCommon("loadFailed"));
    const data = (await res.json()) as BlogAuthor[];
    setAuthors(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch("/api/cms/blog-authors", { signal: controller.signal });
        if (!res.ok) throw new Error(tCommon("loadFailed"));
        const data = (await res.json()) as BlogAuthor[];
        if (!controller.signal.aborted) setAuthors(Array.isArray(data) ? data : []);
      } catch {
        if (!controller.signal.aborted) toast.error(t("loadFailed"));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [t, tCommon]);

  const editing = useMemo(
    () => authors.find((a) => a.id === editingId),
    [authors, editingId]
  );

  const handleSave = async (author: BlogAuthor) => {
    try {
      const res = await fetch("/api/cms/blog-authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(author),
      });
      if (!res.ok) throw new Error(tCommon("saveFailed"));
      await load();
      toast.success(t("saved"));
      setEditingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("couldNotSave"));
    }
  };

  const handleAdd = () => {
    const id = `author-${Date.now()}`;
    const author: BlogAuthor = {
      id,
      name: "",
      email: "",
    };
    setAuthors((prev) => [...prev, author]);
    setEditingId(id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/cms/blog-authors?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(tCommon("deleteFailed"));
      await load();
      toast.success(t("deleted"));
      if (editingId === id) setEditingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("couldNotDelete"));
    }
  };

  return (
    <Can module="blog" action="view" fallback={<AccessDenied />}>
      <div>
        <AdminPageHeader
          title={t("title")}
          description={t("description")}
          actions={
            <Button
              onClick={handleAdd}
              className="gap-1.5 rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
            >
              <Plus className="size-4" />
              {t("add")}
            </Button>
          }
        />

        <MasterDetailLayout
          list={
            loading ? (
              <ListSkeleton rows={6} />
            ) : (
            <div className="divide-y">
              {authors.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {t("empty")}
                </p>
              ) : (
                authors.map((author) => (
                  <button
                    key={author.id}
                    type="button"
                    onClick={() => setEditingId(author.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted/50"
                  >
                    <span className="font-medium">{author.name || t("untitled")}</span>
                    <span className="text-xs text-muted-foreground">{author.email}</span>
                  </button>
                ))
              )}
            </div>
            )
          }
          detail={
            editing ? (
              <div className="space-y-4 p-6">
                <div className="space-y-1.5">
                  <Label>{tCommon("name")}</Label>
                  <Input
                    value={editing.name}
                    onChange={(e) => {
                      const updated = { ...editing, name: e.target.value };
                      setAuthors((prev) =>
                        prev.map((a) => (a.id === updated.id ? updated : a))
                      );
                      setEditingId(updated.id);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{tCommon("email")}</Label>
                  <Input
                    type="email"
                    value={editing.email}
                    onChange={(e) => {
                      const updated = { ...editing, email: e.target.value };
                      setAuthors((prev) =>
                        prev.map((a) => (a.id === updated.id ? updated : a))
                      );
                      setEditingId(updated.id);
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSave(editing)}
                    className="rounded-full bg-oboya-green hover:bg-oboya-green/90"
                  >
                    {t("save")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(editing.id)}
                    className="gap-1.5 rounded-full text-destructive"
                  >
                    <Trash2 className="size-4" />
                    {tCommon("delete")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-sm text-muted-foreground">{tCommon("noRecords")}</div>
            )
          }
        />
      </div>
    </Can>
  );
}
