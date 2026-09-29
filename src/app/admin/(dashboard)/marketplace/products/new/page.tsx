"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AdminPageFooterActions } from "@/components/admin/layout/AdminPageFooterActions";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { FormSkeleton } from "@/components/admin/common";
import { buttonVariants, Button } from "@/components/ui/button";
import { useAdminMarketplaceCatalog } from "@/hooks/use-admin-marketplace-catalog";
import { saveCmsProduct } from "@/lib/cms/repositories/product-repository";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import {
  createEmptyCmsProduct,
  ProductEditorForm,
} from "@/components/admin/marketplace/ProductEditorForm";
import { validateColorVariants } from "@/lib/shop/color-variants";
import { usePendingApprovalNotice } from "@/components/admin/approvals/use-pending-approval-notice";

export default function ProductNewPage() {
  const t = useTranslations("admin.products");
  const router = useRouter();
  const { catalog, loading } = useAdminMarketplaceCatalog();
  const [product, setProduct] = useState<CmsProduct | null>(null);
  const notifyPending = usePendingApprovalNotice();

  useEffect(() => {
    if (loading || product) return;
    setProduct(
      createEmptyCmsProduct({
        categoryId: catalog.categories[0]?.id,
        subcategoryId: catalog.categories[0]?.subcategories[0]?.id,
        brandId: catalog.brands[0]?.id,
      })
    );
  }, [catalog, loading, product]);

  const handleSave = () => {
    if (!product) return;
    const sku = product.sku.trim();
    if (!sku) {
      toast.error("SKU is required.");
      return;
    }
    const toSave: CmsProduct = { ...product, id: sku, sku };
    const variantError = validateColorVariants(toSave.colorVariants, {
      defaultColor: toSave.defaultColor,
      defaultColorName: toSave.defaultColorName,
    });
    if (variantError) {
      toast.error(variantError);
      return;
    }
    void (async () => {
      try {
        saveCmsProduct(toSave);
        const response = await fetch("/api/cms/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toSave),
        });
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) {
          throw new Error(payload?.error ?? "failed");
        }
        if (notifyPending(payload)) {
          router.push("/admin/marketplace/products");
          return;
        }
        toast.success(t("productCreated"));
        router.push(`/admin/marketplace/products/${toSave.id}`);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? t("persistFailedWithReason", { reason: error.message })
            : t("persistFailed")
        );
      }
    })();
  };

  return (
    <div className="pb-24">
      <AdminPageHeader title={t("newTitle")} description={t("newDescription")} />
      {product ? (
        <ProductEditorForm product={product} onChange={setProduct} />
      ) : (
        <FormSkeleton />
      )}

      <AdminPageFooterActions dirty={Boolean(product)}>
        <Link
          href="/admin/marketplace/products"
          className={buttonVariants({
            variant: "outline",
            className: "rounded-full",
          })}
        >
          {t("back")}
        </Link>
        <Button
          onClick={handleSave}
          disabled={!product}
          className="rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
        >
          {t("createProduct")}
        </Button>
      </AdminPageFooterActions>
    </div>
  );
}
