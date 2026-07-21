"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageField } from "@/components/admin/media/ImageField";
import type { HomepageFeaturedCategory } from "@/lib/cms/repositories/homepage-repository";
import {
  LocalizedInput,
  emptyLocalized,
  newId,
  updateLocalizedField,
  type HomepageSectionEditorProps,
} from "../shared";

export function FeaturedCategoriesSectionEditor({
  settings,
  setSettings,
  locale,
}: HomepageSectionEditorProps) {
  const section = settings.featuredProducts;

  const patchFeatured = (
    patch: Partial<typeof section> & { items?: HomepageFeaturedCategory[] }
  ) =>
    setSettings((prev) => ({
      ...prev,
      featuredProducts: { ...prev.featuredProducts, ...patch },
    }));

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Featured Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LocalizedInput
          label="Eyebrow"
          locale={locale}
          value={section.eyebrow[locale]}
          onChange={(l, v) =>
            patchFeatured({ eyebrow: updateLocalizedField(section.eyebrow, l, v) })
          }
        />
        <LocalizedInput
          label="Title"
          locale={locale}
          value={section.title[locale]}
          onChange={(l, v) =>
            patchFeatured({ title: updateLocalizedField(section.title, l, v) })
          }
          multiline
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <LocalizedInput
            label="CTA label"
            locale={locale}
            value={section.ctaLabel[locale]}
            onChange={(l, v) =>
              patchFeatured({ ctaLabel: updateLocalizedField(section.ctaLabel, l, v) })
            }
          />
          <div className="space-y-1.5">
            <Label>CTA link</Label>
            <Input
              value={section.ctaHref}
              onChange={(e) => patchFeatured({ ctaHref: e.target.value })}
            />
          </div>
        </div>

        {section.items.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Category {index + 1}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  patchFeatured({
                    items: section.items.filter((_, i) => i !== index),
                  });
                }}
              >
                Remove
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label>Shop category ID</Label>
              <Input
                value={item.categoryId}
                onChange={(e) => {
                  const items = section.items.map((it, i) =>
                    i === index ? { ...it, categoryId: e.target.value } : it
                  );
                  patchFeatured({ items });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Must match an id from the shop catalog (e.g. packaging, propagation, equipment).
              </p>
            </div>
            <LocalizedInput
              label="Title override (optional)"
              locale={locale}
              value={item.title?.[locale] ?? ""}
              onChange={(l, v) => {
                const items = section.items.map((it, i) =>
                  i === index
                    ? {
                        ...it,
                        title: updateLocalizedField(it.title ?? emptyLocalized(), l, v),
                      }
                    : it
                );
                patchFeatured({ items });
              }}
            />
            <LocalizedInput
              label="Description (optional)"
              locale={locale}
              value={item.description?.[locale] ?? ""}
              onChange={(l, v) => {
                const items = section.items.map((it, i) =>
                  i === index
                    ? {
                        ...it,
                        description: updateLocalizedField(
                          it.description ?? emptyLocalized(),
                          l,
                          v
                        ),
                      }
                    : it
                );
                patchFeatured({ items });
              }}
              multiline
            />
            <ImageField
              label="Cover image"
              value={item.image ?? ""}
              onChange={(url) => {
                const items = section.items.map((it, i) =>
                  i === index ? { ...it, image: url } : it
                );
                patchFeatured({ items });
              }}
              optional
            />
            <LocalizedInput
              label="CTA label (optional)"
              locale={locale}
              value={item.ctaLabel?.[locale] ?? ""}
              onChange={(l, v) => {
                const items = section.items.map((it, i) =>
                  i === index
                    ? {
                        ...it,
                        ctaLabel: updateLocalizedField(it.ctaLabel ?? emptyLocalized(), l, v),
                      }
                    : it
                );
                patchFeatured({ items });
              }}
            />
            <div className="space-y-1.5">
              <Label>CTA link override (optional)</Label>
              <Input
                value={item.ctaHref ?? ""}
                onChange={(e) => {
                  const items = section.items.map((it, i) =>
                    i === index ? { ...it, ctaHref: e.target.value } : it
                  );
                  patchFeatured({ items });
                }}
              />
              <p className="text-xs text-muted-foreground">
                When set, replaces the default shop category link.
              </p>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const item: HomepageFeaturedCategory = {
              id: newId(),
              categoryId: "",
              title: emptyLocalized(),
              description: emptyLocalized(),
              image: "",
              ctaLabel: emptyLocalized(),
              ctaHref: "",
            };
            patchFeatured({ items: [...section.items, item] });
          }}
        >
          Add category
        </Button>
      </CardContent>
    </Card>
  );
}
