"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminPageFooterActions } from "@/components/admin/layout/AdminPageFooterActions";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  saveCmsProduct,
  type CmsProduct,
} from "@/lib/cms/repositories/product-repository";
import { ProductEditorForm } from "@/components/admin/marketplace/ProductEditorForm";
import Link from "next/link";

export default function ProductDetailPage() {
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
    return <div className="text-center text-muted-foreground">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="text-center text-muted-foreground">
        Product not found.{" "}
        <Link href="/admin/marketplace/products" className="text-oboya-green">
          Back to products
        </Link>
      </div>
    );
  }

  const handleSave = () => {
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
        toast.success("Product saved");
        router.push("/admin/marketplace/products");
      } catch (error) {
        toast.error(
          error instanceof Error ? `Could not persist product: ${error.message}` : "Could not persist product."
        );
      }
    })();
  };

  return (
    <div className="pb-24">
      <AdminPageHeader
        title={product.name["pt-BR"] || product.name.en || product.id}
        description={`SKU: ${product.sku} · MOQ: ${product.moq}`}
      />

      <ProductEditorForm product={product} onChange={setProduct} />

      <AdminPageFooterActions>
        <Link
          href="/admin/marketplace/products"
          className={buttonVariants({ variant: "outline", className: "rounded-full" })}
        >
          Back
        </Link>
        <Button
          onClick={handleSave}
          className="rounded-full bg-oboya-green hover:bg-oboya-green/90"
        >
          Save changes
        </Button>
      </AdminPageFooterActions>
    </div>
  );
}
