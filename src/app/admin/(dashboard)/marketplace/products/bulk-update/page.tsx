"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Can } from "@/components/admin/permissions/Can";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getShopCatalog } from "@/lib/shop/catalog";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

export default function ProductBulkUpdatePage() {
  const catalog = getShopCatalog();
  const [skuInput, setSkuInput] = useState("");
  const [addTagsInput, setAddTagsInput] = useState("");
  const [removeTagsInput, setRemoveTagsInput] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [products, setProducts] = useState<CmsProduct[]>([]);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/cms/products", { cache: "no-store" });
      const list = (await response.json()) as CmsProduct[];
      setProducts(list);
    })();
  }, []);

  const selectedCategory = catalog.categories.find((category) => category.id === categoryId);
  const skus = skuInput
    .split(/[\n,;]/)
    .map((sku) => sku.trim())
    .filter(Boolean);
  const preview = useMemo(() => {
    const set = new Set(skus.map((sku) => sku.toLowerCase()));
    return products.filter((product) => set.has(product.sku.toLowerCase()));
  }, [products, skus]);

  const apply = () => {
    void (async () => {
    if (skus.length === 0) {
      toast.error("Informe ao menos um SKU.");
      return;
    }
    const addTags = addTagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const removeTags = removeTagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const skuSet = new Set(skus.map((sku) => sku.toLowerCase()));
    const matches = products.filter((product) => skuSet.has(product.sku.toLowerCase()));
    const payloads = matches.map((product) => {
      const nextTags = new Set(product.tags);
      addTags.forEach((tag) => nextTags.add(tag));
      removeTags.forEach((tag) => nextTags.delete(tag));
      return {
        ...product,
        tags: Array.from(nextTags),
        categoryId: categoryId || product.categoryId,
        subcategoryId: subcategoryId || product.subcategoryId,
        brandId: brandId || product.brandId,
      } satisfies CmsProduct;
    });

    await Promise.all(
      payloads.map((product) =>
        fetch(`/api/cms/products/${product.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(product),
        })
      )
    );

    const response = await fetch("/api/cms/products", { cache: "no-store" });
    const refreshed = (await response.json()) as CmsProduct[];
    setProducts(refreshed);
    toast.success(`${payloads.length} produto(s) atualizado(s).`);
    })();
  };

  return (
    <Can module="marketplace" action="edit">
      <AdminPageHeader
        title="Bulk Update"
        description="Aplique ajustes em lote por lista de SKUs."
        actions={
          <Link
            href="/admin/marketplace/products"
            className={buttonVariants({ variant: "outline", className: "rounded-full" })}
          >
            Back to products
          </Link>
        }
      />

      <div className="rounded-xl border border-border/60 bg-white p-4">
        <p className="mb-3 text-sm font-semibold">SKUs de referência</p>
        <Textarea
          rows={5}
          value={skuInput}
          onChange={(e) => setSkuInput(e.target.value)}
          placeholder="SKU-001, SKU-002..."
        />

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <Input
            value={addTagsInput}
            onChange={(e) => setAddTagsInput(e.target.value)}
            placeholder="Adicionar tags: organic, premium"
          />
          <Input
            value={removeTagsInput}
            onChange={(e) => setRemoveTagsInput(e.target.value)}
            placeholder="Remover tags: old, test"
          />
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              const next = catalog.categories.find((c) => c.id === e.target.value);
              setSubcategoryId(next?.subcategories[0]?.id ?? "");
            }}
            className="h-9 rounded-lg border border-input px-2.5 text-sm"
          >
            <option value="">Categoria (opcional)</option>
            {catalog.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            className="h-9 rounded-lg border border-input px-2.5 text-sm"
          >
            <option value="">Subcategoria (opcional)</option>
            {(selectedCategory?.subcategories ?? []).map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="h-9 rounded-lg border border-input px-2.5 text-sm"
          >
            <option value="">Brand (opcional)</option>
            {catalog.brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3">
          <Button onClick={apply} className="rounded-full bg-oboya-green text-white hover:bg-oboya-green/90">
            Aplicar alterações em lote
          </Button>
        </div>

        <div className="mt-4 rounded-lg border border-border/60 p-3">
          <p className="text-xs font-semibold text-oboya-blue-dark">
            Pré-visualização: {preview.length} SKU(s) encontrados
          </p>
          <div className="mt-2 max-h-40 overflow-y-auto text-xs">
            {preview.map((product) => (
              <div key={product.id} className="py-1">
                {product.sku} — {product.name["pt-BR"] || product.name.en || product.id}
              </div>
            ))}
            {preview.length === 0 && (
              <p className="text-muted-foreground">Nenhum produto encontrado para os SKUs informados.</p>
            )}
          </div>
        </div>
      </div>
    </Can>
  );
}

