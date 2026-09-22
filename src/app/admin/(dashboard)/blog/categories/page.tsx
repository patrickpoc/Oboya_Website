"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { LocaleFieldTabs, emptyLocalizedString } from "@/components/admin/forms/LocaleFieldTabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/admin/permissions/Can";
import type { BlogCategory } from "@/lib/cms/repositories/blog-categories-repository";
import type { CmsLocale } from "@/lib/cms/types";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";

export default function BlogCategoriesPage() {
  const t = useTranslations("admin.blog.categories");
  const tCommon = useTranslations("admin.common");
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [locale, setLocale] = useState<CmsLocale>("en");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/cms/blog-categories");
    if (!res.ok) throw new Error(tCommon("loadFailed"));
    const data = (await res.json()) as BlogCategory[];
    setCategories(Array.isArray(data) ? data : []);
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
  }, []);

  const editing = useMemo(
    () => categories.find((c) => c.id === editingId),
    [categories, editingId]
  );

  const handleSave = async (category: BlogCategory) => {
    try {
      const res = await fetch("/api/cms/blog-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
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
    const id = `category-${Date.now()}`;
    const category: BlogCategory = {
      id,
      slug: id,
      name: emptyLocalizedString(),
    };
    setCategories((prev) => [...prev, category]);
    setEditingId(id);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/cms/blog-categories?id=${id}`, { method: "DELETE" });
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

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="divide-y p-0">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setEditingId(category.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted/50"
                >
                  <span className="font-medium">{category.name.en || category.slug}</span>
                  <span className="text-xs text-muted-foreground">{category.slug}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {editing && (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-1.5">
                  <Label>{tCommon("slug")}</Label>
                  <Input
                    value={editing.slug}
                    onChange={(e) => {
                      const updated = { ...editing, slug: e.target.value };
                      setCategories((prev) =>
                        prev.map((c) => (c.id === updated.id ? updated : c))
                      );
                      setEditingId(updated.id);
                    }}
                  />
                </div>

                <LocaleFieldTabs value={locale} onChange={setLocale}>
                  {(loc) => (
                    <div className="space-y-1.5">
                      <Label>{tCommon("name")}</Label>
                      <Input
                        value={editing.name[loc]}
                        onChange={(e) => {
                          const updated = {
                            ...editing,
                            name: { ...editing.name, [loc]: e.target.value },
                          };
                          setCategories((prev) =>
                            prev.map((c) => (c.id === updated.id ? updated : c))
                          );
                          setEditingId(updated.id);
                        }}
                      />
                    </div>
                  )}
                </LocaleFieldTabs>

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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Can>
  );
}
