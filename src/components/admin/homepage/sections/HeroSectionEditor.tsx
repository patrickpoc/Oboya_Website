"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageField } from "@/components/admin/media/ImageField";
import {
  LocalizedInput,
  updateLocalizedField,
  type HomepageSectionEditorProps,
} from "../shared";

export function HeroSectionEditor({
  settings,
  setSettings,
  locale,
}: HomepageSectionEditorProps) {
  const hero = settings.hero;

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Hero</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ImageField
          label="Background image"
          value={hero.backgroundImage}
          onChange={(url) =>
            setSettings({
              ...settings,
              hero: { ...hero, backgroundImage: url },
            })
          }
        />
        <LocalizedInput
          label="Eyebrow"
          locale={locale}
          value={hero.eyebrow[locale]}
          onChange={(l, v) =>
            setSettings({
              ...settings,
              hero: { ...hero, eyebrow: updateLocalizedField(hero.eyebrow, l, v) },
            })
          }
        />
        <LocalizedInput
          label="Headline"
          locale={locale}
          value={hero.title[locale]}
          onChange={(l, v) =>
            setSettings({
              ...settings,
              hero: { ...hero, title: updateLocalizedField(hero.title, l, v) },
            })
          }
        />
        <LocalizedInput
          label="Subheadline"
          locale={locale}
          value={hero.description[locale]}
          onChange={(l, v) =>
            setSettings({
              ...settings,
              hero: {
                ...hero,
                description: updateLocalizedField(hero.description, l, v),
              },
            })
          }
          multiline
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">Primary CTA</p>
            <LocalizedInput
              label="Label"
              locale={locale}
              value={hero.ctaPrimary.label[locale]}
              onChange={(l, v) =>
                setSettings({
                  ...settings,
                  hero: {
                    ...hero,
                    ctaPrimary: {
                      ...hero.ctaPrimary,
                      label: updateLocalizedField(hero.ctaPrimary.label, l, v),
                    },
                  },
                })
              }
            />
            <div className="space-y-1.5">
              <Label>Link</Label>
              <Input
                value={hero.ctaPrimary.href}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    hero: {
                      ...hero,
                      ctaPrimary: { ...hero.ctaPrimary, href: e.target.value },
                    },
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">Secondary CTA</p>
            <LocalizedInput
              label="Label"
              locale={locale}
              value={hero.ctaSecondary.label[locale]}
              onChange={(l, v) =>
                setSettings({
                  ...settings,
                  hero: {
                    ...hero,
                    ctaSecondary: {
                      ...hero.ctaSecondary,
                      label: updateLocalizedField(hero.ctaSecondary.label, l, v),
                    },
                  },
                })
              }
            />
            <div className="space-y-1.5">
              <Label>Link</Label>
              <Input
                value={hero.ctaSecondary.href}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    hero: {
                      ...hero,
                      ctaSecondary: {
                        ...hero.ctaSecondary,
                        href: e.target.value,
                      },
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
