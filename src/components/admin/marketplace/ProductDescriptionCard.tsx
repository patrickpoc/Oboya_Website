"use client";

import { useState } from "react";
import { CMS_LOCALES } from "@/contexts/AdminContext";
import { ProductRichTextEditor } from "@/components/admin/marketplace/ProductRichTextEditor";
import { LocalizedFieldGrid } from "@/components/admin/marketplace/LocalizedFieldGrid";
import { RegistrationSection } from "@/components/admin/marketplace/RegistrationSection";
import { ProductDescriptionContent } from "@/components/shop/product/ProductDescriptionContent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { CmsLocale } from "@/lib/cms/types";

interface ProductDescriptionCardProps {
  product: CmsProduct;
  onUpdate: (patch: Partial<CmsProduct>) => void;
}

export function ProductDescriptionCard({ product, onUpdate }: ProductDescriptionCardProps) {
  const [previewLocale, setPreviewLocale] = useState<CmsLocale>("en");

  const updateShortDescription = (locale: CmsLocale, value: string) => {
    onUpdate({
      shortDescription: { ...product.shortDescription, [locale]: value },
    });
  };

  const updateDescription = (locale: CmsLocale, value: string) => {
    onUpdate({
      description: { ...product.description, [locale]: value },
    });
  };

  const enEmpty =
    !product.description.en?.trim() &&
    (product.description["pt-BR"]?.trim() ||
      product.description.es?.trim() ||
      product.description["zh-CN"]?.trim());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product description</CardTitle>
        <CardDescription>
          Rich content for the product page. Description images are stored separately from the
          product gallery.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RegistrationSection
          title="Short description"
          description="Plain-text teaser for catalog cards and quick view. Optional."
        >
          <LocalizedFieldGrid
            label="Short description"
            value={product.shortDescription}
            onChange={updateShortDescription}
            multiline
            rows={3}
            placeholder="Brief summary shown on product cards"
          />
        </RegistrationSection>

        <RegistrationSection
          title="Full description"
          description="English is the fallback when another locale is empty."
        >
          {enEmpty ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Other locales have content but English is empty. The shop will fall back to English
              when a locale is missing.
            </p>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            {CMS_LOCALES.map((loc) => (
              <div key={loc.value} className="space-y-2 rounded-lg border border-border/60 p-3">
                <Label className="text-sm font-medium text-oboya-blue-dark">
                  {loc.label}
                  {loc.value === "en" ? " (default)" : ""}
                </Label>
                <ProductRichTextEditor
                  value={product.description[loc.value] ?? ""}
                  onChange={(value) => updateDescription(loc.value, value)}
                  placeholder={`Write the ${loc.label} product description…`}
                />
              </div>
            ))}
          </div>
        </RegistrationSection>

        <RegistrationSection title="Preview" description="Approximate storefront rendering.">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {CMS_LOCALES.map((loc) => (
                <button
                  key={`preview-${loc.value}`}
                  type="button"
                  onClick={() => setPreviewLocale(loc.value)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    previewLocale === loc.value
                      ? "border-oboya-green bg-oboya-green/10 text-oboya-blue-dark"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
            <div className="rounded-lg border border-border/60 bg-oboya-soft-white p-4">
              <ProductDescriptionContent
                html={product.description[previewLocale] ?? ""}
                fallbackHtml={product.description.en}
              />
            </div>
          </div>
        </RegistrationSection>
      </CardContent>
    </Card>
  );
}
