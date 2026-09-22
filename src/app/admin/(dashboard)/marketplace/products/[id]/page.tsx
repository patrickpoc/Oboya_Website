"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AdminPageFooterActions } from "@/components/admin/layout/AdminPageFooterActions";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  saveCmsProduct,
  type CmsProduct,
} from "@/lib/cms/repositories/product-repository";
import { ProductEditorForm } from "@/components/admin/marketplace/ProductEditorForm";
import { validateColorVariants } from "@/lib/shop/color-variants";
import Link from "next/link";

export default function ProductDetailPage() {
  const t = useTranslations("admin.products");
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [product, setProduct] = useState<CmsProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(`/api/cms/products/${id}`, { cache: "no-store" });
        if (!response.ok) {
          setProduct(null);
          return;
        }
        const payload = (await response.json()) as CmsProduct;
        setProduct(payload);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="min-h-[40vh]" aria-hidden />;
  }

  if (!product) {
    return (
      <div className="text-center text-muted-foreground">
        {t("notFound")}{" "}
        <Link href="/admin/marketplace/products" className="text-oboya-green">
          {t("backToProducts")}
        </Link>
      </div>
    );
  }

  const handleSave = () => {
    const variantError = validateColorVariants(product.colorVariants, {
      defaultColor: product.defaultColor,
      defaultColorName: product.defaultColorName,
    });
    if (variantError) {
      toast.error(variantError);
      return;
    }
    void (async () => {
      try {
        saveCmsProduct(product);
        const response = await fetch(`/api/cms/products/${product.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(product),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "failed");
        }
        toast.success(t("productSaved"));
        router.push("/admin/marketplace/products");
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
      <AdminPageHeader
        title={product.name["pt-BR"] || product.name.en || product.id}
        description={t("skuMoqMeta", { sku: product.sku, moq: product.moq })}
      />

      <ProductEditorForm product={product} onChange={setProduct} />

      <AdminPageFooterActions>
        <Link
          href="/admin/marketplace/products"
          className={buttonVariants({ variant: "outline", className: "rounded-full" })}
        >
          {t("back")}
        </Link>
        <Button
          onClick={handleSave}
          className="rounded-full bg-oboya-green hover:bg-oboya-green/90"
        >
          {t("saveChanges")}
        </Button>
      </AdminPageFooterActions>
    </div>
  );
}
