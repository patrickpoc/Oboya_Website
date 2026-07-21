"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FormDrawer } from "@/components/admin/forms/FormDrawer";
import {
  LocaleFieldTabs,
  emptyLocalizedString,
} from "@/components/admin/forms/LocaleFieldTabs";
import { Can } from "@/components/admin/permissions/Can";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getCategories,
  getFaqs,
  saveCategory,
  saveFaq,
  deleteCategory,
  deleteFaq,
  type CmsFaqCategory,
  type CmsFaqItem,
} from "@/lib/cms/repositories/faqs-repository";
import type { CmsLocale } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

type DrawerMode = "category" | "faq" | null;

async function persistCategory(category: CmsFaqCategory) {
  saveCategory(category);
  try {
    await fetch("/api/cms/faqs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", data: category }),
    });
  } catch {
    // in-memory fallback
  }
}

async function persistFaq(faq: CmsFaqItem) {
  saveFaq(faq);
  try {
    await fetch("/api/cms/faqs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "faq", data: faq }),
    });
  } catch {
    // in-memory fallback
  }
}

async function removeCategory(id: string) {
  deleteCategory(id);
  try {
    await fetch(`/api/cms/faqs?type=category&id=${id}`, { method: "DELETE" });
  } catch {
    // in-memory fallback
  }
}

async function removeFaq(id: string) {
  deleteFaq(id);
  try {
    await fetch(`/api/cms/faqs?type=faq&id=${id}`, { method: "DELETE" });
  } catch {
    // in-memory fallback
  }
}

export default function FaqsAdminPage() {
  const [categories, setCategories] = useState(getCategories());
  const [faqs, setFaqs] = useState(getFaqs());
  const [locale, setLocale] = useState<CmsLocale>("en");
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [editingCategory, setEditingCategory] = useState<CmsFaqCategory | null>(
    null
  );
  const [editingFaq, setEditingFaq] = useState<CmsFaqItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const refresh = () => {
    setCategories(getCategories());
    setFaqs(getFaqs());
  };

  const editingCategoryDraft = editingCategory;

  const filteredFaqs = useMemo(() => {
    if (categoryFilter === "all") return faqs;
    return faqs.filter((f) => f.categoryId === categoryFilter);
  }, [faqs, categoryFilter]);

  const tableRows = useMemo(
    () =>
      filteredFaqs.map((faq) => ({
        ...faq,
        questionText: faq.question.en || "",
      })),
    [filteredFaqs]
  );

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.title.en || id;

  const openNewCategory = () => {
    const id = `category-${Date.now()}`;
    const category: CmsFaqCategory = {
      id,
      slug: id,
      title: emptyLocalizedString(),
      order: categories.length + 1,
    };
    saveCategory(category);
    refresh();
    setEditingCategory(category);
    setDrawerMode("category");
  };

  const openEditCategory = (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;
    setEditingCategory({ ...category });
    setDrawerMode("category");
  };

  const openNewFaq = () => {
    const categoryId =
      categoryFilter !== "all" ? categoryFilter : categories[0]?.id ?? "products";
    const faq: CmsFaqItem = {
      id: `faq-${Date.now()}`,
      categoryId,
      question: emptyLocalizedString(),
      answer: emptyLocalizedString(),
      keywords: [],
      order: faqs.filter((f) => f.categoryId === categoryId).length + 1,
      status: "draft",
    };
    setEditingFaq(faq);
    setDrawerMode("faq");
  };

  const openEditFaq = (faq: CmsFaqItem) => {
    setEditingFaq({ ...faq });
    setDrawerMode("faq");
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setEditingCategory(null);
    setEditingFaq(null);
  };

  const handleSaveCategory = async () => {
    if (!editingCategoryDraft) return;
    await persistCategory(editingCategoryDraft);
    refresh();
    toast.success("Category saved");
    closeDrawer();
  };

  const handleDeleteCategory = async (id: string) => {
    await removeCategory(id);
    refresh();
    toast.success("Category deleted");
    if (editingCategoryDraft?.id === id) closeDrawer();
  };

  const handleSaveFaq = async () => {
    if (!editingFaq) return;
    await persistFaq(editingFaq);
    refresh();
    toast.success("FAQ saved");
    closeDrawer();
  };

  const handleDeleteFaq = async (id: string) => {
    await removeFaq(id);
    refresh();
    toast.success("FAQ deleted");
    if (editingFaq?.id === id) closeDrawer();
  };

  const faqColumns = [
    {
      key: "question",
      header: "Question",
      sortable: true,
      cell: (row: CmsFaqItem) => (
        <span className="line-clamp-2 font-medium">
          {row.question.en || "Untitled FAQ"}
        </span>
      ),
    },
    {
      key: "categoryId",
      header: "Category",
      cell: (row: CmsFaqItem) => (
        <span className="text-muted-foreground">{categoryName(row.categoryId)}</span>
      ),
    },
    {
      key: "order",
      header: "Order",
      sortable: true,
      cell: (row: CmsFaqItem) => row.order,
    },
    {
      key: "status",
      header: "Status",
      cell: (row: CmsFaqItem) => (
        <Badge variant={row.status === "published" ? "default" : "secondary"}>
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <Can
      module="website"
      action="view"
      fallback={<p className="text-sm text-muted-foreground">Access denied.</p>}
    >
      <div>
        <AdminPageHeader
          title="FAQs"
          description="Manage FAQ categories and published questions for the public /faqs page."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={openNewCategory}
                className="gap-1.5 rounded-full"
              >
                <Plus className="size-4" />
                New category
              </Button>
              <Button
                onClick={openNewFaq}
                className="gap-1.5 rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
              >
                <Plus className="size-4" />
                New FAQ
              </Button>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(240px,280px)_1fr]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Categories</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-1 px-2 py-1 hover:bg-muted/40"
                >
                  <button
                    type="button"
                    onClick={() => openEditCategory(category.id)}
                    className="flex flex-1 items-center justify-between px-2 py-2 text-left text-sm"
                  >
                    <span className="font-medium">
                      {category.title.en || category.slug}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      #{category.order}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-destructive"
                    onClick={() => handleDeleteCategory(category.id)}
                    aria-label="Delete category"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  categoryFilter === "all"
                    ? "bg-oboya-blue-dark text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryFilter(category.id)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    categoryFilter === category.id
                      ? "bg-oboya-blue-dark text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {category.title.en || category.slug}
                </button>
              ))}
            </div>

            <DataTable
              data={tableRows}
              columns={faqColumns}
              searchKey="questionText"
              searchPlaceholder="Search FAQs…"
              getRowId={(row) => row.id}
              onRowClick={(row) => openEditFaq(row)}
              pageSize={12}
              emptyMessage="No FAQs in this category."
            />
          </div>
        </div>

        <FormDrawer
          open={drawerMode === "category" && !!editingCategoryDraft}
          onClose={closeDrawer}
          title="Edit category"
          description="Localized titles appear on the public FAQs page."
          footer={
            <div className="flex gap-2">
              <Button
                onClick={handleSaveCategory}
                className="rounded-full bg-oboya-green hover:bg-oboya-green/90"
              >
                Save category
              </Button>
              {editingCategoryDraft && (
                <Button
                  variant="outline"
                  onClick={() => handleDeleteCategory(editingCategoryDraft.id)}
                  className="gap-1.5 rounded-full text-destructive"
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              )}
            </div>
          }
        >
          {editingCategoryDraft && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input
                    value={editingCategoryDraft.slug}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategoryDraft,
                        slug: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={editingCategoryDraft.order}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategoryDraft,
                        order: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <LocaleFieldTabs value={locale} onChange={setLocale}>
                {(loc) => (
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input
                      value={editingCategoryDraft.title[loc]}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategoryDraft,
                          title: {
                            ...editingCategoryDraft.title,
                            [loc]: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                )}
              </LocaleFieldTabs>
            </div>
          )}
        </FormDrawer>

        <FormDrawer
          open={drawerMode === "faq" && !!editingFaq}
          onClose={closeDrawer}
          title={editingFaq?.question.en ? "Edit FAQ" : "New FAQ"}
          description="Questions and answers support all site locales."
          width="lg"
          footer={
            <div className="flex gap-2">
              <Button
                onClick={handleSaveFaq}
                className="rounded-full bg-oboya-green hover:bg-oboya-green/90"
              >
                Save FAQ
              </Button>
              {editingFaq && (
                <Button
                  variant="outline"
                  onClick={() => handleDeleteFaq(editingFaq.id)}
                  className="gap-1.5 rounded-full text-destructive"
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              )}
            </div>
          }
        >
          {editingFaq && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select
                    value={editingFaq.categoryId}
                    onChange={(e) =>
                      setEditingFaq({ ...editingFaq, categoryId: e.target.value })
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.title.en || category.slug}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={editingFaq.order}
                    onChange={(e) =>
                      setEditingFaq({
                        ...editingFaq,
                        order: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  value={editingFaq.status}
                  onChange={(e) =>
                    setEditingFaq({
                      ...editingFaq,
                      status: e.target.value as CmsFaqItem["status"],
                    })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Keywords (comma-separated)</Label>
                <Input
                  value={editingFaq.keywords.join(", ")}
                  onChange={(e) =>
                    setEditingFaq({
                      ...editingFaq,
                      keywords: e.target.value
                        .split(",")
                        .map((k) => k.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="shop, catalogue, samples"
                />
              </div>

              <LocaleFieldTabs value={locale} onChange={setLocale}>
                {(loc) => (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Question</Label>
                      <Input
                        value={editingFaq.question[loc]}
                        onChange={(e) =>
                          setEditingFaq({
                            ...editingFaq,
                            question: {
                              ...editingFaq.question,
                              [loc]: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Answer</Label>
                      <Textarea
                        rows={5}
                        value={editingFaq.answer[loc]}
                        onChange={(e) =>
                          setEditingFaq({
                            ...editingFaq,
                            answer: {
                              ...editingFaq.answer,
                              [loc]: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </LocaleFieldTabs>
            </div>
          )}
        </FormDrawer>
      </div>
    </Can>
  );
}
