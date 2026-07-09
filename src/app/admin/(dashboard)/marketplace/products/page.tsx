"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FormDrawer } from "@/components/admin/forms/FormDrawer";
import { LocaleFieldTabs, emptyLocalizedString } from "@/components/admin/forms/LocaleFieldTabs";
import { Can } from "@/components/admin/permissions/Can";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteCmsProduct,
  duplicateCmsProduct,
  getCmsProducts,
  saveCmsProduct,
  type CmsProduct,
} from "@/lib/cms/repositories/product-repository";
import { getShopCatalog } from "@/lib/shop/catalog";
import type { CmsLocale, CmsStatus } from "@/lib/cms/types";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState(getCmsProducts());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CmsProduct | null>(null);
  const [locale, setLocale] = useState<CmsLocale>("en");
  const [selected, setSelected] = useState<string[]>([]);

  const categories = getShopCatalog().categories;
  const brands = getShopCatalog().brands;

  const openCreate = () => {
    setEditing({
      id: `product-${Date.now()}`,
      sku: "",
      moq: 1,
      brandId: brands[0]?.id ?? "",
      categoryId: categories[0]?.id ?? "",
      subcategoryId: categories[0]?.subcategories[0]?.id ?? "",
      images: [],
      tags: [],
      availability: {},
      prices: {},
      application: [],
      cultures: [],
      certifications: [],
      countryOfOrigin: "",
      stockStatus: "in_stock",
      specs: [],
      documents: [],
      relatedProductIds: [],
      name: emptyLocalizedString(),
      shortDescription: emptyLocalizedString(),
      description: emptyLocalizedString(),
      status: "draft",
      seo: { title: emptyLocalizedString(), description: emptyLocalizedString() },
    });
    setDrawerOpen(true);
  };

  const openEdit = (product: CmsProduct) => {
    setEditing({ ...product });
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!editing) return;
    saveCmsProduct(editing);
    setProducts([...getCmsProducts()]);
    setDrawerOpen(false);
    toast.success("Product saved");
  };

  const handleDelete = (id: string) => {
    deleteCmsProduct(id);
    setProducts([...getCmsProducts()]);
    toast.success("Product deleted");
  };

  const handleDuplicate = (id: string) => {
    const copy = duplicateCmsProduct(id);
    if (copy) {
      setProducts([...getCmsProducts()]);
      toast.success("Product duplicated");
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        cell: (row: CmsProduct) => row.name.en || row.id,
      },
      { key: "sku", header: "SKU", sortable: true, cell: (row: CmsProduct) => row.sku },
      {
        key: "categoryId",
        header: "Category",
        cell: (row: CmsProduct) => row.categoryId,
      },
      {
        key: "moq",
        header: "MOQ",
        cell: (row: CmsProduct) => row.moq,
      },
      {
        key: "status",
        header: "Status",
        cell: (row: CmsProduct) => (
          <Badge variant={row.status === "published" ? "default" : "secondary"}>
            {row.status}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "",
        cell: (row: CmsProduct) => (
          <div className="flex justify-end gap-1">
            <Can module="marketplace" action="edit">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(row);
                }}
                className="rounded p-1 hover:bg-muted"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicate(row.id);
                }}
                className="rounded p-1 hover:bg-muted"
              >
                <Copy className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row.id);
                }}
                className="rounded p-1 text-destructive hover:bg-muted"
              >
                <Trash2 className="size-3.5" />
              </button>
            </Can>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <Can module="marketplace" action="view">
      <AdminPageHeader
        title="Products"
        description="Create, edit, duplicate and archive marketplace products."
        actions={
          <Can module="marketplace" action="create">
            <button
              type="button"
              onClick={openCreate}
              className={buttonVariants({
                className: "gap-1.5 rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
              })}
            >
              <Plus className="size-4" />
              Add product
            </button>
          </Can>
        }
      />

      <DataTable
        data={products}
        columns={columns}
        searchKey="sku"
        searchPlaceholder="Search by SKU..."
        getRowId={(r) => r.id}
        selectedIds={selected}
        onSelectionChange={setSelected}
        onRowClick={(row) => router.push(`/admin/marketplace/products/${row.id}`)}
      />

      <FormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing?.name.en ? `Edit ${editing.name.en}` : "New product"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDrawerOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button onClick={handleSave} className="rounded-full bg-oboya-green hover:bg-oboya-green/90">
              Save product
            </Button>
          </div>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input
                  value={editing.sku}
                  onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>MOQ</Label>
                <Input
                  type="number"
                  value={editing.moq}
                  onChange={(e) =>
                    setEditing({ ...editing, moq: Number(e.target.value) || 1 })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <select
                value={editing.status}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value as CmsStatus })
                }
                className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <LocaleFieldTabs value={locale} onChange={setLocale}>
              {(loc) => (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Name ({loc})</Label>
                    <Input
                      value={editing.name[loc]}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          name: { ...editing.name, [loc]: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Short description</Label>
                    <Textarea
                      value={editing.shortDescription[loc]}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          shortDescription: {
                            ...editing.shortDescription,
                            [loc]: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Full description</Label>
                    <Textarea
                      rows={5}
                      value={editing.description[loc]}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          description: {
                            ...editing.description,
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
    </Can>
  );
}
