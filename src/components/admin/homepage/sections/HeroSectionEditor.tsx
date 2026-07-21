"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageField } from "@/components/admin/media/ImageField";
import type { HomepageHeroPill } from "@/lib/cms/repositories/homepage-repository";
import {
  LocalizedInput,
  emptyLocalized,
  newId,
  updateSettingsLocalized,
  type HomepageSectionEditorProps,
} from "../shared";

const HERO_PILL_ICONS: HomepageHeroPill["icon"][] = [
  "logistics",
  "research",
  "plants",
  "vegetable",
  "flower",
  "fruit",
];

export function HeroSectionEditor({
  settings,
  setSettings,
  locale,
}: HomepageSectionEditorProps) {
  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Hero</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ImageField
          label="Background image"
          value={settings.hero.backgroundImage}
          onChange={(url) =>
            setSettings({
              ...settings,
              hero: { ...settings.hero, backgroundImage: url },
            })
          }
        />
        <LocalizedInput
          label="Eyebrow"
          locale={locale}
          value={settings.hero.eyebrow[locale]}
          onChange={(l, v) => updateSettingsLocalized(setSettings, "hero", "eyebrow", l, v)}
        />
        <LocalizedInput
          label="Headline"
          locale={locale}
          value={settings.hero.title[locale]}
          onChange={(l, v) => updateSettingsLocalized(setSettings, "hero", "title", l, v)}
        />
        <LocalizedInput
          label="Subheadline"
          locale={locale}
          value={settings.hero.description[locale]}
          onChange={(l, v) => updateSettingsLocalized(setSettings, "hero", "description", l, v)}
          multiline
        />
        <p className="text-xs text-muted-foreground">
          Navigation pills: edit labels and links below.
        </p>
        {settings.hero.pills.map((pill, index) => (
          <div key={pill.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Pill {index + 1}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const pills = settings.hero.pills.filter((_, i) => i !== index);
                  setSettings({
                    ...settings,
                    hero: { ...settings.hero, pills },
                  });
                }}
              >
                Remove
              </Button>
            </div>
            <LocalizedInput
              label={`Pill ${index + 1} label`}
              locale={locale}
              value={pill.label[locale]}
              onChange={(_, v) => {
                const pills = [...settings.hero.pills];
                pills[index] = {
                  ...pill,
                  label: { ...pill.label, [locale]: v },
                };
                setSettings({ ...settings, hero: { ...settings.hero, pills } });
              }}
            />
            <LocalizedInput
              label="Sublabel"
              locale={locale}
              value={pill.sublabel[locale]}
              onChange={(_, v) => {
                const pills = [...settings.hero.pills];
                pills[index] = {
                  ...pill,
                  sublabel: { ...pill.sublabel, [locale]: v },
                };
                setSettings({ ...settings, hero: { ...settings.hero, pills } });
              }}
            />
            <div className="space-y-1.5">
              <Label>Link</Label>
              <Input
                value={pill.href}
                onChange={(e) => {
                  const pills = [...settings.hero.pills];
                  pills[index] = { ...pill, href: e.target.value };
                  setSettings({ ...settings, hero: { ...settings.hero, pills } });
                }}
              />
            </div>
            <ImageField
              label="Pill image"
              value={pill.image ?? ""}
              onChange={(url) => {
                const pills = [...settings.hero.pills];
                pills[index] = { ...pill, image: url };
                setSettings({ ...settings, hero: { ...settings.hero, pills } });
              }}
              optional
            />
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <select
                value={pill.icon}
                onChange={(e) => {
                  const pills = [...settings.hero.pills];
                  pills[index] = {
                    ...pill,
                    icon: e.target.value as HomepageHeroPill["icon"],
                  };
                  setSettings({ ...settings, hero: { ...settings.hero, pills } });
                }}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm"
              >
                {HERO_PILL_ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const pill: HomepageHeroPill = {
              id: newId(),
              label: emptyLocalized(),
              sublabel: emptyLocalized(),
              href: "/",
              icon: "vegetable",
              image: "",
            };
            setSettings({
              ...settings,
              hero: {
                ...settings.hero,
                pills: [...settings.hero.pills, pill],
              },
            });
          }}
        >
          Add pill
        </Button>
      </CardContent>
    </Card>
  );
}
