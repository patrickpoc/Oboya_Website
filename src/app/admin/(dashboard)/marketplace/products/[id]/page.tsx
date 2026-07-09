"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { LocaleFieldTabs, emptyLocalizedString } from "@/components/admin/forms/LocaleFieldTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  getCmsProductById,
  saveCmsProduct,
} from "@/lib/cms/repositories/product-repository";
import { useState } from "react";
import type { CmsLocale, CmsStatus } from "@/lib/cms/types";
import Link from "next/link";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const existing = getCmsProductById(id);

  const [product, setProduct] = useState(existing);
  const [locale, setLocale] = useState<CmsLocale>("en");

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
    saveCmsProduct(product);
    toast.success("Product saved");
    router.push("/admin/marketplace/products");
  };

  return (
    <div>
      <AdminPageHeader
        title={product.name.en || product.id}
        description={`SKU: ${product.sku} · MOQ: ${product.moq}`}
        actions={
          <div className="flex gap-2">
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
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input
                  value={product.sku}
                  onChange={(e) => setProduct({ ...product, sku: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>MOQ</Label>
                <Input
                  type="number"
                  value={product.moq}
                  onChange={(e) =>
                    setProduct({ ...product, moq: Number(e.target.value) || 1 })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select
                value={product.status}
                onChange={(e) =>
                  setProduct({ ...product, status: e.target.value as CmsStatus })
                }
                className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>USD Price</Label>
              <Input
                type="number"
                value={product.prices.USD ?? ""}
                onChange={(e) =>
                  setProduct({
                    ...product,
                    prices: { ...product.prices, USD: Number(e.target.value) },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Localized content</CardTitle>
          </CardHeader>
          <CardContent>
            <LocaleFieldTabs value={locale} onChange={setLocale}>
              {(loc) => (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input
                      value={product.name[loc]}
                      onChange={(e) =>
                        setProduct({
                          ...product,
                          name: { ...product.name, [loc]: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      rows={6}
                      value={product.description[loc]}
                      onChange={(e) =>
                        setProduct({
                          ...product,
                          description: {
                            ...product.description,
                            [loc]: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>SEO title</Label>
                    <Input
                      value={product.seo.title[loc]}
                      onChange={(e) =>
                        setProduct({
                          ...product,
                          seo: {
                            ...product.seo,
                            title: { ...product.seo.title, [loc]: e.target.value },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </LocaleFieldTabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
