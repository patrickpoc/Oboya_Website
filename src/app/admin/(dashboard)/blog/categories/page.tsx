"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { LocaleFieldTabs, emptyLocalizedString } from "@/components/admin/forms/LocaleFieldTabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/admin/permissions/Can";
import {
  getBlogCategories,
  saveBlogCategory,
  deleteBlogCategory,
  type BlogCategory,
} from "@/lib/cms/repositories/blog-categories-repository";
import type { CmsLocale } from "@/lib/cms/types";

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState(getBlogCategories());
  const [locale, setLocale] = useState<CmsLocale>("en");
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = useMemo(
    () => categories.find((c) => c.id === editingId),
    [categories, editingId]
  );

  const handleSave = async (category: BlogCategory) => {
    saveBlogCategory(category);
    setCategories(getBlogCategories());
    try {
      await fetch("/api/cms/blog-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      });
    } catch {
      // in-memory fallback
    }
    toast.success("Category saved");
    setEditingId(null);
  };

  const handleAdd = () => {
    const id = `category-${Date.now()}`;
    const category: BlogCategory = {
      id,
      slug: id,
      name: emptyLocalizedString(),
    };
    saveBlogCategory(category);
    setCategories(getBlogCategories());
    setEditingId(id);
  };

  const handleDelete = async (id: string) => {
    deleteBlogCategory(id);
    setCategories(getBlogCategories());
    try {
      await fetch(`/api/cms/blog-categories?id=${id}`, { method: "DELETE" });
    } catch {
      // in-memory fallback
    }
    toast.success("Category deleted");
    if (editingId === id) setEditingId(null);
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
                      saveBlogCategory(updated);
                      setCategories(getBlogCategories());
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
                          saveBlogCategory(updated);
                          setCategories(getBlogCategories());
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
