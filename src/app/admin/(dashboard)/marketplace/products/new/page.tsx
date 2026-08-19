"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { buttonVariants, Button } from "@/components/ui/button";
import { getShopCatalog } from "@/lib/shop/catalog";
import { saveCmsProduct } from "@/lib/cms/repositories/product-repository";
import {
  createEmptyCmsProduct,
  ProductEditorForm,
} from "@/components/admin/marketplace/ProductEditorForm";

export default function ProductNewPage() {
  const router = useRouter();
  const catalog = getShopCatalog();
  const [product, setProduct] = useState(
    createEmptyCmsProduct({
      categoryId: catalog.categories[0]?.id,
      subcategoryId: catalog.categories[0]?.subcategories[0]?.id,
      brandId: catalog.brands[0]?.id,
    })
  );

  const handleSave = () => {
    void (async () => {
      try {
        saveCmsProduct(product);
        const response = await fetch("/api/cms/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(product),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "failed");
        }
        toast.success("Product created");
        router.push(`/admin/marketplace/products/${product.id}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? `Could not persist product: ${error.message}` : "Could not persist product."
        );
      }
    })();
  };

  return (
    <div>
      <AdminPageHeader
        title="New product"
        description="Create a product with translations, media, countries and prices."
        actions={
          <div className="flex gap-2">
            <Link
              href="/admin/marketplace/products"
              className={buttonVariants({
                variant: "outline",
                className: "rounded-full",
              })}
            >
              Back
            </Link>
            <Button
              onClick={handleSave}
              className="rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
            >
              Create product
            </Button>
          </div>
        }
      />
      <ProductEditorForm product={product} onChange={setProduct} />
    </div>
  );
}

