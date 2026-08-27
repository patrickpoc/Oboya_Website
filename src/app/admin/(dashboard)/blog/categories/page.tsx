"use client";

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

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [locale, setLocale] = useState<CmsLocale>("en");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/cms/blog-categories");
    if (!res.ok) throw new Error("Failed to load");
    const data = (await res.json()) as BlogCategory[];
    setCategories(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch {
        toast.error("Could not load categories");
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
      if (!res.ok) throw new Error("Save failed");
      await load();
      toast.success("Category saved");
      setEditingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
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
      if (!res.ok) throw new Error("Delete failed");
      await load();
      toast.success("Category deleted");
      if (editingId === id) setEditingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete");
    }
  };

  return (
    <Can module="blog" action="view" fallback={<p className="text-sm text-muted-foreground">Access denied.</p>}>
      <div>
        <AdminPageHeader
          title="Blog Categories"
          description="Categories appear in the /news filter dropdown and on article cards."
          actions={
            <Button
              onClick={handleAdd}
              className="gap-1.5 rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
            >
              <Plus className="size-4" />
              New category
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
                  <Label>Slug</Label>
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
                      <Label>Name</Label>
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
                    Save category
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(editing.id)}
                    className="gap-1.5 rounded-full text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Delete
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
