"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageField } from "@/components/admin/media/ImageField";
import type { HomepageBusinessSolution } from "@/lib/cms/repositories/homepage-repository";
import {
  LocalizedInput,
  emptyLocalized,
  newId,
  updateLocalizedField,
  type HomepageSectionEditorProps,
} from "../shared";

export function BusinessSolutionsSectionEditor({
  settings,
  setSettings,
  locale,
}: HomepageSectionEditorProps) {
  const section = settings.businessSolutions;

  const patch = (
    next: Partial<typeof section> & { items?: HomepageBusinessSolution[] }
  ) =>
    setSettings((prev) => ({
      ...prev,
      businessSolutions: { ...prev.businessSolutions, ...next },
    }));

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Solutions Tailored to Your Business</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LocalizedInput
          label="Eyebrow"
          locale={locale}
          value={section.eyebrow[locale]}
          onChange={(l, v) =>
            patch({ eyebrow: updateLocalizedField(section.eyebrow, l, v) })
          }
        />
        <LocalizedInput
          label="Title"
          locale={locale}
          value={section.title[locale]}
          onChange={(l, v) =>
            patch({ title: updateLocalizedField(section.title, l, v) })
          }
          multiline
        />

        {section.items.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium">Card {index + 1}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() =>
                  patch({ items: section.items.filter((_, i) => i !== index) })
                }
              >
                Remove
              </Button>
            </div>
            <LocalizedInput
              label="Title"
              locale={locale}
              value={item.title[locale]}
              onChange={(l, v) => {
                const items = section.items.map((it, i) =>
                  i === index
                    ? { ...it, title: updateLocalizedField(it.title, l, v) }
                    : it
                );
                patch({ items });
              }}
            />
            <LocalizedInput
              label="Description"
              locale={locale}
              value={item.description[locale]}
              onChange={(l, v) => {
                const items = section.items.map((it, i) =>
                  i === index
                    ? {
                        ...it,
                        description: updateLocalizedField(it.description, l, v),
                      }
                    : it
                );
                patch({ items });
              }}
              multiline
            />
            <ImageField
              label="Background image"
              value={item.image ?? ""}
              onChange={(url) => {
                const items = section.items.map((it, i) =>
                  i === index ? { ...it, image: url } : it
                );
                patch({ items });
              }}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <LocalizedInput
                label="Explore label"
                locale={locale}
                value={(item.ctaLabel ?? emptyLocalized())[locale]}
                onChange={(l, v) => {
                  const items = section.items.map((it, i) =>
                    i === index
                      ? {
                          ...it,
                          ctaLabel: updateLocalizedField(
                            it.ctaLabel ?? emptyLocalized(),
                            l,
                            v
                          ),
                        }
                      : it
                  );
                  patch({ items });
                }}
              />
              <div className="space-y-1.5">
                <Label>Link</Label>
                <Input
                  value={item.href ?? ""}
                  onChange={(e) => {
                    const items = section.items.map((it, i) =>
                      i === index ? { ...it, href: e.target.value } : it
                    );
                    patch({ items });
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() =>
            patch({
              items: [
                ...section.items,
                {
                  id: newId(),
                  title: emptyLocalized(),
                  description: emptyLocalized(),
                  image: "",
                  href: "/solutions",
                  ctaLabel: emptyLocalized(),
                },
              ],
            })
          }
        >
          Add card
        </Button>
      </CardContent>
    </Card>
  );
}
