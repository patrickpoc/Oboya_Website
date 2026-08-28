"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { LocalizedFieldGrid } from "@/components/admin/marketplace/LocalizedFieldGrid";
import { RegistrationSection } from "@/components/admin/marketplace/RegistrationSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { CmsLocale } from "@/lib/cms/types";
import { addProductTag, removeProductTag } from "@/lib/shop/product-tags";

interface ProductSeoCardProps {
  product: CmsProduct;
  onUpdate: (patch: Partial<CmsProduct>) => void;
}

export function ProductSeoCard({ product, onUpdate }: ProductSeoCardProps) {
  const [newKeyword, setNewKeyword] = useState("");

  const updateSeoField = (
    key: "title" | "description",
    locale: CmsLocale,
    value: string
  ) => {
    onUpdate({
      seo: {
        ...product.seo,
        [key]: { ...product.seo[key], [locale]: value },
      },
    });
  };

  const addKeyword = () => {
    const nextTags = addProductTag(product.tags ?? [], newKeyword);
    if (nextTags === product.tags) return;
    onUpdate({ tags: nextTags });
    setNewKeyword("");
  };

  const removeKeyword = (tag: string) => {
    onUpdate({ tags: removeProductTag(product.tags ?? [], tag) });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>SEO & keywords</CardTitle>
        <CardDescription>Search metadata and shop search keywords.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <RegistrationSection
          title="SEO"
          description="Page title and meta description overrides for public pages."
          isFirst
        >
          <div className="space-y-4 rounded-lg bg-muted/30 p-4">
            <LocalizedFieldGrid
              label="SEO title"
              value={product.seo.title}
              onChange={(locale, value) => updateSeoField("title", locale, value)}
            />
            <LocalizedFieldGrid
              label="SEO description"
              value={product.seo.description}
              onChange={(locale, value) => updateSeoField("description", locale, value)}
              multiline
              rows={2}
            />
          </div>
        </RegistrationSection>

        <RegistrationSection
          title="Keywords"
          description="Used by shop search (name, SKU and keywords)."
        >
          <div className="space-y-3 rounded-lg bg-muted/30 p-4">
            {(product.tags ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {(product.tags ?? []).map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      className="rounded-sm p-0.5 hover:bg-muted"
                      aria-label={`Remove keyword ${tag}`}
                      onClick={() => removeKeyword(tag)}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No keywords yet.</p>
            )}
            <div className="flex gap-2">
              <Input
                className="max-w-md"
                placeholder="Add keyword"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addKeyword}>
                Add
              </Button>
            </div>
          </div>
        </RegistrationSection>
      </CardContent>
    </Card>
  );
}
