"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageField } from "@/components/admin/media/ImageField";
import type { HomepageCapability } from "@/lib/cms/repositories/homepage-repository";
import {
  LocalizedInput,
  emptyLocalized,
  newId,
  updateLocalizedField,
  type HomepageSectionEditorProps,
} from "../shared";

export function CapabilitiesSectionEditor({
  settings,
  setSettings,
  locale,
}: HomepageSectionEditorProps) {
  const section = settings.capabilities;

  const patchCapabilities = (
    patch: Partial<typeof section> & { items?: HomepageCapability[] }
  ) =>
    setSettings((prev) => ({
      ...prev,
      capabilities: { ...prev.capabilities, ...patch },
    }));

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Capabilities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LocalizedInput
          label="Eyebrow"
          locale={locale}
          value={section.eyebrow[locale]}
          onChange={(l, v) =>
            patchCapabilities({ eyebrow: updateLocalizedField(section.eyebrow, l, v) })
          }
        />
        <LocalizedInput
          label="Title"
          locale={locale}
          value={section.title[locale]}
          onChange={(l, v) =>
            patchCapabilities({ title: updateLocalizedField(section.title, l, v) })
          }
          multiline
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <LocalizedInput
            label="CTA label"
            locale={locale}
            value={section.ctaLabel[locale]}
            onChange={(l, v) =>
              patchCapabilities({ ctaLabel: updateLocalizedField(section.ctaLabel, l, v) })
            }
          />
          <div className="space-y-1.5">
            <Label>CTA link</Label>
            <Input
              value={section.ctaHref}
              onChange={(e) => patchCapabilities({ ctaHref: e.target.value })}
            />
          </div>
        </div>

        {section.items.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Item {index + 1}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  patchCapabilities({
                    items: section.items.filter((_, i) => i !== index),
                  });
                }}
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
                  i === index ? { ...it, title: updateLocalizedField(it.title, l, v) } : it
                );
                patchCapabilities({ items });
              }}
            />
            <LocalizedInput
              label="Description"
              locale={locale}
              value={item.description[locale]}
              onChange={(l, v) => {
                const items = section.items.map((it, i) =>
                  i === index
                    ? { ...it, description: updateLocalizedField(it.description, l, v) }
                    : it
                );
                patchCapabilities({ items });
              }}
              multiline
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <ImageField
                label="Image"
                value={item.image}
                onChange={(url) => {
                  const items = section.items.map((it, i) =>
                    i === index ? { ...it, image: url } : it
                  );
                  patchCapabilities({ items });
                }}
              />
              <div className="space-y-1.5">
                <Label>Link</Label>
                <Input
                  value={item.href}
                  onChange={(e) => {
                    const items = section.items.map((it, i) =>
                      i === index ? { ...it, href: e.target.value } : it
                    );
                    patchCapabilities({ items });
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const item: HomepageCapability = {
              id: newId(),
              title: emptyLocalized(),
              description: emptyLocalized(),
              image: "",
              href: "/",
            };
            patchCapabilities({ items: [...section.items, item] });
          }}
        >
          Add capability
        </Button>
      </CardContent>
    </Card>
  );
}
