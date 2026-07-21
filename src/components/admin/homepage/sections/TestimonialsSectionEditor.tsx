"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { HomepageTestimonial } from "@/lib/cms/repositories/homepage-repository";
import {
  LocalizedInput,
  emptyLocalized,
  newId,
  updateSettingsLocalized,
  type HomepageSectionEditorProps,
} from "../shared";

export function TestimonialsSectionEditor({
  settings,
  setSettings,
  locale,
}: HomepageSectionEditorProps) {
  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Testimonials</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LocalizedInput
          label="Eyebrow"
          locale={locale}
          value={settings.testimonials.eyebrow[locale]}
          onChange={(l, v) => updateSettingsLocalized(setSettings, "testimonials", "eyebrow", l, v)}
        />
        {settings.testimonials.items.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Testimonial {index + 1}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const items = settings.testimonials.items.filter((_, i) => i !== index);
                  setSettings({
                    ...settings,
                    testimonials: { ...settings.testimonials, items },
                  });
                }}
              >
                Remove
              </Button>
            </div>
            <LocalizedInput
              label="Quote"
              locale={locale}
              value={item.quote[locale]}
              onChange={(_, v) => {
                const items = [...settings.testimonials.items];
                items[index] = {
                  ...item,
                  quote: { ...item.quote, [locale]: v },
                };
                setSettings({
                  ...settings,
                  testimonials: { ...settings.testimonials, items },
                });
              }}
              multiline
            />
            <LocalizedInput
              label="Author"
              locale={locale}
              value={item.author[locale]}
              onChange={(_, v) => {
                const items = [...settings.testimonials.items];
                items[index] = {
                  ...item,
                  author: { ...item.author, [locale]: v },
                };
                setSettings({
                  ...settings,
                  testimonials: { ...settings.testimonials, items },
                });
              }}
            />
            <LocalizedInput
              label="Role"
              locale={locale}
              value={item.role[locale]}
              onChange={(_, v) => {
                const items = [...settings.testimonials.items];
                items[index] = {
                  ...item,
                  role: { ...item.role, [locale]: v },
                };
                setSettings({
                  ...settings,
                  testimonials: { ...settings.testimonials, items },
                });
              }}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const item: HomepageTestimonial = {
              id: newId(),
              quote: emptyLocalized(),
              author: emptyLocalized(),
              role: emptyLocalized(),
            };
            setSettings({
              ...settings,
              testimonials: {
                ...settings.testimonials,
                items: [...settings.testimonials.items, item],
              },
            });
          }}
        >
          Add testimonial
        </Button>
      </CardContent>
    </Card>
  );
}
