"use client";

import { RegistrationSection } from "@/components/admin/marketplace/RegistrationSection";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { CmsStatus } from "@/lib/cms/types";

export function isProductPublished(status: CmsStatus) {
  return status === "published";
}

interface ProductPublicationCardProps {
  product: CmsProduct;
  onUpdate: (patch: Partial<CmsProduct>) => void;
}

export function ProductPublicationCard({ product, onUpdate }: ProductPublicationCardProps) {
  const published = isProductPublished(product.status);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Publication</CardTitle>
        <CardDescription>Make the product available in the public catalog.</CardDescription>
      </CardHeader>

      <CardContent>
        <RegistrationSection
          title="Catalog visibility"
          description="Products are saved as draft until you enable availability."
          isFirst
        >
          <div className="flex flex-wrap items-center gap-4 rounded-lg bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <input
                id="product-published"
                type="checkbox"
                className="mt-0.5 size-4 rounded border-input"
                checked={published}
                onChange={(e) =>
                  onUpdate({ status: e.target.checked ? "published" : "draft" })
                }
              />
              <div className="space-y-1">
                <Label htmlFor="product-published">Available in the shop</Label>
                <p className="text-xs text-muted-foreground">
                  When unchecked, the product stays as draft and is hidden from buyers.
                </p>
              </div>
            </div>
            <Badge variant={published ? "default" : "secondary"}>
              {published ? "Published" : "Draft"}
            </Badge>
          </div>
        </RegistrationSection>
      </CardContent>
    </Card>
  );
}
