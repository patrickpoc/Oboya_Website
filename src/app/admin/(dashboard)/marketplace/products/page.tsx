"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Can } from "@/components/admin/permissions/Can";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

const PAGE_SIZE = 20;

type ViewTab = "active" | "trash";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<CmsProduct[]>([]);
  const [deletedProducts, setDeletedProducts] = useState<CmsProduct[]>([]);
  const [tab, setTab] = useState<ViewTab>("active");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const refresh = async () => {
    const response = await fetch("/api/cms/products?includeDeleted=1", { cache: "no-store" });
    const all = (await response.json()) as CmsProduct[];
    setProducts(all.filter((p) => !p.deletedAt));
    setDeletedProducts(all.filter((p) => Boolean(p.deletedAt)));
    setSelected([]);
  };

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, []);

  const handleDelete = (id: string) => {
    void (async () => {
      const ok = window.confirm("Remover produto? Ele irá para a lixeira por 24h.");
      if (!ok) return;
      await fetch(`/api/cms/products/${id}`, { method: "DELETE" });
      await refresh();
      toast.success("Produto movido para lixeira.");
    })();
  };

  const handleBulkDelete = () => {
    void (async () => {
      if (selected.length === 0) return;
      const ok = window.confirm(`Remover ${selected.length} produto(s)?`);
      if (!ok) return;
      await Promise.all(selected.map((id) => fetch(`/api/cms/products/${id}`, { method: "DELETE" })));
      await refresh();
      toast.success(`${selected.length} produto(s) movido(s) para lixeira.`);
    })();
  };

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => {
      const name = (
        product.name["pt-BR"] ||
        product.name.en ||
        product.name.es ||
        product.name["zh-CN"] ||
        ""
      ).toLowerCase();
      return name.includes(q) || product.sku.toLowerCase().includes(q);
    });
  }, [products, search]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleDuplicate = (id: string) => {
    void (async () => {
      const original = products.find((product) => product.id === id);
      if (!original) return;
      const copy: CmsProduct = {
        ...JSON.parse(JSON.stringify(original)),
        id: `${original.id}-copy-${Date.now()}`,
        sku: `${original.sku}-COPY`,
        status: "draft",
        deletedAt: null,
        purgeAt: null,
      };
      await fetch("/api/cms/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(copy),
      });
      await refresh();
      toast.success("Produto duplicado.");
    })();
  };

  return (
    <Can module="marketplace" action="view">
      <AdminPageHeader
        title="Products"
        description="Grid de produtos com criação, edição, paginação e lixeira."
        actions={
          <Can module="marketplace" action="create">
            <Link
              href="/admin/marketplace/products/new"
              className={buttonVariants({
                className:
                  "gap-1.5 rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
              })}
            >
              <Plus className="size-4" />
              Add product
            </Link>
          </Can>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={buttonVariants({
            variant: tab === "active" ? "default" : "outline",
            className: "rounded-full",
          })}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setTab("trash")}
          className={buttonVariants({
            variant: tab === "trash" ? "default" : "outline",
            className: "rounded-full",
          })}
        >
          Trash ({deletedProducts.length})
        </button>
      </div>

      {tab === "active" ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <Input
              className="max-w-xs"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by product name or SKU"
            />
            <Button
              variant="destructive"
              disabled={selected.length === 0}
              onClick={handleBulkDelete}
              className="rounded-full"
            >
              <Trash2 className="mr-1 size-4" />
              Delete selected ({selected.length})
            </Button>
            <Link
              href="/admin/marketplace/products/bulk-import"
              className={buttonVariants({ variant: "outline", className: "rounded-full" })}
            >
              Bulk import
            </Link>
            <Link
              href="/admin/marketplace/products/bulk-update"
              className={buttonVariants({ variant: "outline", className: "rounded-full" })}
            >
              Bulk update
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {paginatedProducts.map((product) => {
              const checked = selected.includes(product.id);
              const mainImage = product.images[0] || "";
              const isUnavailable =
                Object.values(product.prices).every((value) => !value || value <= 0) ||
                (!product.unlimitedStock && (product.stockQuantity ?? 0) <= 0);
              return (
                <article
                  key={product.id}
                  className="rounded-xl border border-border/60 bg-white shadow-sm"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-muted/40">
                    {mainImage ? (
                      <Image
                        src={mainImage}
                        alt={product.name["pt-BR"] || product.id}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        sem imagem
                      </div>
                    )}
                    <input
                      type="checkbox"
                      className="absolute top-2 left-2"
                      checked={checked}
                      onChange={(e) => {
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, product.id]
                            : prev.filter((id) => id !== product.id)
                        );
                      }}
                    />
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="line-clamp-2 text-sm font-semibold text-oboya-blue-dark">
                          {product.name["pt-BR"] || product.name.en || product.id}
                        </p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                      <button
                        type="button"
                        className="rounded p-1 hover:bg-muted"
                        onClick={() => router.push(`/admin/marketplace/products/${product.id}`)}
                      >
                        <Pencil className="size-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      USD: {product.prices.USD ?? 0} | BRL: {product.prices.BRL ?? 0} | EUR:{" "}
                      {product.prices.EUR ?? 0}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={product.status === "published" ? "default" : "secondary"}>
                        {product.status}
                      </Badge>
                      {isUnavailable && <Badge variant="destructive">hidden in shop</Badge>}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleDuplicate(product.id)}
                      >
                        <Copy className="mr-1 size-3.5" />
                        Duplicate
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="mr-1 size-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Prev
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} / {pageCount}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage >= pageCount}
            >
              Next
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {deletedProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-white p-3"
            >
              <div>
                <p className="font-medium text-oboya-blue-dark">
                  {product.name["pt-BR"] || product.name.en || product.id}
                </p>
                <p className="text-xs text-muted-foreground">
                  SKU {product.sku} · purge at {product.purgeAt}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void (async () => {
                      await fetch(`/api/cms/products/${product.id}?action=restore`, {
                        method: "POST",
                      });
                      await refresh();
                    })()
                  }
                >
                  Restore
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    void (async () => {
                      const ok = window.confirm("Remover permanentemente da lixeira?");
                      if (!ok) return;
                      await fetch(`/api/cms/products/${product.id}?hard=1`, {
                        method: "DELETE",
                      });
                      await refresh();
                    })()
                  }
                >
                  Delete now
                </Button>
              </div>
            </div>
          ))}
          {deletedProducts.length === 0 && (
            <p className="text-sm text-muted-foreground">Lixeira vazia.</p>
          )}
        </div>
      )}
    </Can>
  );
}
