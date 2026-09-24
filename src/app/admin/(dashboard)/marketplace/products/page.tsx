"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Archive, ArchiveRestore, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Can } from "@/components/admin/permissions/Can";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

const PAGE_SIZE = 20;

type ViewTab = "active" | "archived" | "trash";

type ProductsPageResponse = {
  items: CmsProduct[];
  total: number;
  page: number;
  limit: number;
  tabCounts?: { active: number; archived: number; trash: number };
  unitStats?: { total: number; active: number; draft: number };
};

function buildUniqueDuplicateSku(baseSku: string, existingSkus: Set<string>) {
  const candidate = `${baseSku}-COPY`;
  if (!existingSkus.has(candidate.toLowerCase())) return candidate;

  let suffix = 2;
  while (existingSkus.has(`${baseSku}-COPY-${suffix}`.toLowerCase())) {
    suffix += 1;
  }
  return `${baseSku}-COPY-${suffix}`;
}

function productDisplayName(product: CmsProduct) {
  return product.name["pt-BR"] || product.name.en || product.name.es || product.name["zh-CN"] || product.id;
}

async function fetchFullProduct(id: string): Promise<CmsProduct | null> {
  const response = await fetch(`/api/cms/products/${id}`, { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as CmsProduct;
}

export default function ProductsPage() {
  const t = useTranslations("admin.products");
  const tCommon = useTranslations("admin.common");
  const router = useRouter();
  const [products, setProducts] = useState<CmsProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [tabCounts, setTabCounts] = useState({ active: 0, archived: 0, trash: 0 });
  const [unitStats, setUnitStats] = useState({ total: 0, active: 0, draft: 0 });
  const [tab, setTab] = useState<ViewTab>("active");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const refresh = async (opts?: { purgeTrash?: boolean }) => {
    setLoading(true);
    try {
      if (opts?.purgeTrash) {
        try {
          await fetch("/api/cms/products/purge", { method: "POST" });
        } catch {
          // Best-effort.
        }
      }

      const params = new URLSearchParams({
        includeDeleted: "1",
        fields: "table",
        page: String(page),
        limit: String(PAGE_SIZE),
        tab,
        q: debouncedSearch,
      });
      const response = await fetch(`/api/cms/products?${params}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        toast.error(t("loadFailed"));
        return;
      }
      const data = (await response.json()) as ProductsPageResponse;
      if (!data || !Array.isArray(data.items)) {
        toast.error(t("loadFailed"));
        return;
      }
      setProducts(data.items);
      setTotal(data.total);
      setSelected([]);
      if (data.tabCounts) setTabCounts(data.tabCounts);
      if (data.unitStats) setUnitStats(data.unitStats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void refresh({ purgeTrash: tab === "trash" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional refresh keys
  }, [tab, page, debouncedSearch]);

  const handleDelete = (id: string) => {
    void (async () => {
      const ok = window.confirm(t("deleteConfirm"));
      if (!ok) return;
      await fetch(`/api/cms/products/${id}`, { method: "DELETE" });
      await refresh();
      toast.success(t("deleteSuccess"));
    })();
  };

  const handleBulkDelete = () => {
    void (async () => {
      if (selected.length === 0) return;
      const ok = window.confirm(t("bulkDeleteConfirm", { count: selected.length }));
      if (!ok) return;
      await Promise.all(selected.map((id) => fetch(`/api/cms/products/${id}`, { method: "DELETE" })));
      await refresh();
      toast.success(t("bulkDeleteSuccess", { count: selected.length }));
    })();
  };

  const handleArchive = (product: CmsProduct) => {
    void (async () => {
      const ok = window.confirm(t("archiveConfirm"));
      if (!ok) return;
      const full = (await fetchFullProduct(product.id)) ?? product;
      const response = await fetch(`/api/cms/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...full, status: "archived" }),
      });
      if (!response.ok) {
        toast.error(t("archiveFailed"));
        return;
      }
      await refresh();
      toast.success(t("archiveSuccess"));
    })();
  };

  const handleUnarchive = (product: CmsProduct) => {
    void (async () => {
      const full = (await fetchFullProduct(product.id)) ?? product;
      const response = await fetch(`/api/cms/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...full, status: "draft" }),
      });
      if (!response.ok) {
        toast.error(t("unarchiveFailed"));
        return;
      }
      await refresh();
      toast.success(t("unarchiveSuccess"));
    })();
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedProducts = products;

  const productUnitStats = unitStats;

  const handleDuplicate = (id: string) => {
    void (async () => {
      const original = await fetchFullProduct(id);
      if (!original) {
        toast.error(t("loadFailed"));
        return;
      }
      const skuRes = await fetch(
        "/api/cms/products?fields=skus",
        { cache: "no-store" }
      );
      const skuPayload = skuRes.ok
        ? ((await skuRes.json()) as { skus?: string[] })
        : { skus: [] };
      const existingSkus = new Set(
        (Array.isArray(skuPayload.skus) ? skuPayload.skus : []).map((s) =>
          s.toLowerCase()
        )
      );
      const newSku = buildUniqueDuplicateSku(original.sku, existingSkus);
      existingSkus.add(newSku.toLowerCase());
      const colorVariants = (original.colorVariants ?? []).map((variant) => {
        const base = variant.sku?.trim() || `${newSku}-COLOR`;
        const variantSku = buildUniqueDuplicateSku(base, existingSkus);
        existingSkus.add(variantSku.toLowerCase());
        return { ...variant, sku: variantSku, id: variantSku };
      });
      const copy: CmsProduct = {
        ...JSON.parse(JSON.stringify(original)),
        id: newSku,
        sku: newSku,
        colorVariants,
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
      toast.success(t("duplicateSuccess"));
    })();
  };

  const switchTab = (next: ViewTab) => {
    setTab(next);
    setPage(1);
    setSelected([]);
    setSearch("");
  };

  return (
    <Can module="marketplace" action="view">
      <AdminPageHeader
        title={t("title")}
        description={
          <dl className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground sm:gap-x-4">
            <div className="inline-flex items-baseline gap-1.5 rounded-full bg-white/80 px-2.5 py-1 ring-1 ring-oboya-blue-dark/10">
              <dt>{t("statTotal")}</dt>
              <dd className="font-semibold tabular-nums text-oboya-blue-dark">
                {productUnitStats.total}
              </dd>
            </div>
            <div className="inline-flex items-baseline gap-1.5 rounded-full bg-white/80 px-2.5 py-1 ring-1 ring-oboya-green/25">
              <dt>{t("statActive")}</dt>
              <dd className="font-semibold tabular-nums text-oboya-green">
                {productUnitStats.active}
              </dd>
            </div>
            <div className="inline-flex items-baseline gap-1.5 rounded-full bg-white/80 px-2.5 py-1 ring-1 ring-oboya-blue-dark/10">
              <dt>{t("statDraft")}</dt>
              <dd className="font-semibold tabular-nums text-oboya-blue-dark/70">
                {productUnitStats.draft}
              </dd>
            </div>
          </dl>
        }
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
              {t("addProduct")}
            </Link>
          </Can>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => switchTab("active")}
          className={buttonVariants({
            variant: tab === "active" ? "default" : "outline",
            className: "rounded-full",
          })}
        >
          {t("tabActive")}
        </button>
        <button
          type="button"
          onClick={() => switchTab("archived")}
          className={buttonVariants({
            variant: tab === "archived" ? "default" : "outline",
            className: "rounded-full",
          })}
        >
          {t("tabArchive", { count: tabCounts.archived })}
        </button>
        <button
          type="button"
          onClick={() => switchTab("trash")}
          className={buttonVariants({
            variant: tab === "trash" ? "default" : "outline",
            className: "rounded-full",
          })}
        >
          {t("tabTrash", { count: tabCounts.trash })}
        </button>
      </div>

      {tab === "trash" ? (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-white p-3"
            >
              <div>
                <p className="font-medium text-oboya-blue-dark">{productDisplayName(product)}</p>
                <p className="text-xs text-muted-foreground">
                  {t("purgeAt", { sku: product.sku, purgeAt: product.purgeAt ?? "—" })}
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
                  {tCommon("restore")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    void (async () => {
                      const ok = window.confirm(t("hardDeleteConfirm"));
                      if (!ok) return;
                      const response = await fetch(`/api/cms/products/${product.id}?hard=1`, {
                        method: "DELETE",
                      });
                      if (!response.ok) {
                        toast.error(t("hardDeleteFailed"));
                        return;
                      }
                      await refresh();
                      toast.success(t("hardDeleteSuccess"));
                    })()
                  }
                >
                  {t("deleteNow")}
                </Button>
              </div>
            </div>
          ))}
          {!loading && products.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("emptyTrash")}</p>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <Input
              className="max-w-xs"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t("searchPlaceholder")}
            />
            {tab === "active" && (
              <Button
                variant="destructive"
                disabled={selected.length === 0}
                onClick={handleBulkDelete}
                className="rounded-full"
              >
                <Trash2 className="mr-1 size-4" />
                {t("deleteSelected", { count: selected.length })}
              </Button>
            )}
          </div>

          {paginatedProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {tab === "archived" ? t("emptyArchive") : t("emptyActive")}
            </p>
          ) : (
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
                          alt={productDisplayName(product)}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          {t("noImage")}
                        </div>
                      )}
                      {tab === "active" && (
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
                      )}
                    </div>
                    <div className="space-y-2 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="line-clamp-2 text-sm font-semibold text-oboya-blue-dark">
                            {productDisplayName(product)}
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
                        {isUnavailable && <Badge variant="destructive">{t("hiddenInShop")}</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tab === "active" ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleDuplicate(product.id)}
                            >
                              <Copy className="mr-1 size-3.5" />
                              {tCommon("duplicate")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleArchive(product)}
                            >
                              <Archive className="mr-1 size-3.5" />
                              {tCommon("archive")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="mr-1 size-3.5" />
                              {tCommon("delete")}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleUnarchive(product)}
                            >
                              <ArchiveRestore className="mr-1 size-3.5" />
                              {tCommon("unarchive")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="mr-1 size-3.5" />
                              {tCommon("delete")}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              {tCommon("prev")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("pageLabel", { current: currentPage, total: pageCount })}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage >= pageCount}
            >
              {tCommon("next")}
            </Button>
          </div>
        </>
      )}
    </Can>
  );
}
