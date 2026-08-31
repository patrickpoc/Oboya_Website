"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageField } from "@/components/admin/media/ImageField";
import type {
  AboutImpactStatIcon,
  AboutPageSettings,
} from "@/lib/cms/repositories/about-page-repository";
import type { CmsLocale } from "@/lib/cms/types";
import type { Dispatch, SetStateAction } from "react";

const ICON_OPTIONS: AboutImpactStatIcon[] = [
  "globe",
  "factory",
  "building",
  "users",
  "handshake",
  "package",
  "calendar",
];

/** Brand palette accents for collapsed Numbers panels. */
const ACCENT_OPTIONS = [
  { label: "Main Blue", value: "#004F7C" },
  { label: "Light Blue", value: "#009CD4" },
  { label: "Dark Blue", value: "#01203F" },
  { label: "Main Green", value: "#4DAF4E" },
  { label: "Light Green", value: "#75C566" },
  { label: "Orange Red", value: "#ea5744" },
  { label: "Dark Yellow", value: "#909B03" },
  { label: "Light Yellow", value: "#DBE64C" },
] as const;

export type AboutSectionEditorProps = {
  settings: AboutPageSettings;
  setSettings: Dispatch<SetStateAction<AboutPageSettings>>;
  locale: CmsLocale;
};

function LocalizedField({
  label,
  value,
  locale,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  locale: CmsLocale;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}{" "}
        <span className="text-muted-foreground">({locale})</span>
      </Label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-input px-3 py-2 text-sm"
        />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

export function ImpactSectionEditor({
  settings,
  setSettings,
  locale,
}: AboutSectionEditorProps) {
  const impact = settings.impact;

  const updateStat = (
    index: number,
    patch: Partial<(typeof impact.stats)[number]>
  ) => {
    const stats = impact.stats.map((stat, i) =>
      i === index ? { ...stat, ...patch } : stat
    );
    setSettings({
      ...settings,
      impact: { ...impact, stats },
    });
  };

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Oboya in Numbers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
          <Label htmlFor="impact-enabled">Section enabled</Label>
          <Switch
            id="impact-enabled"
            checked={settings.sections.impact.enabled}
            onCheckedChange={(checked) =>
              setSettings({
                ...settings,
                sections: {
                  ...settings.sections,
                  impact: { enabled: checked },
                },
              })
            }
          />
        </div>

        <LocalizedField
          label="Title"
          locale={locale}
          value={impact.title[locale] ?? ""}
          onChange={(v) =>
            setSettings({
              ...settings,
              impact: {
                ...impact,
                title: { ...impact.title, [locale]: v },
              },
            })
          }
        />
        <LocalizedField
          label="Description"
          locale={locale}
          multiline
          value={impact.description[locale] ?? ""}
          onChange={(v) =>
            setSettings({
              ...settings,
              impact: {
                ...impact,
                description: { ...impact.description, [locale]: v },
              },
            })
          }
        />

        <p className="text-xs text-muted-foreground">
          Pending metrics show XX on the site until a verified value is set.
          Accent color tints the collapsed card and open text bar. Saves to live{" "}
          <code className="rounded bg-muted px-1">cms_documents</code>{" "}
          (about-page).
        </p>

        {impact.stats.map((stat, index) => (
          <div key={stat.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium capitalize">{stat.id}</p>
              <div className="flex items-center gap-2">
                <Label htmlFor={`pending-${stat.id}`} className="text-xs">
                  Pending
                </Label>
                <Switch
                  id={`pending-${stat.id}`}
                  checked={stat.pending === true}
                  onCheckedChange={(checked) =>
                    updateStat(index, { pending: checked })
                  }
                />
              </div>
            </div>

            <LocalizedField
              label="Label"
              locale={locale}
              value={stat.label[locale] ?? ""}
              onChange={(v) =>
                updateStat(index, {
                  label: { ...stat.label, [locale]: v },
                })
              }
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Value</Label>
                <Input
                  type="number"
                  value={stat.value}
                  disabled={stat.pending === true}
                  onChange={(e) =>
                    updateStat(index, { value: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Suffix</Label>
                <Input
                  value={stat.suffix}
                  disabled={stat.pending === true}
                  onChange={(e) =>
                    updateStat(index, { suffix: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Icon</Label>
                <select
                  value={stat.icon}
                  onChange={(e) =>
                    updateStat(index, {
                      icon: e.target.value as AboutImpactStatIcon,
                    })
                  }
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                >
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Accent color</Label>
                <div className="flex items-center gap-2">
                  <span
                    className="size-8 shrink-0 rounded-md border"
                    style={{ backgroundColor: stat.accentColor }}
                    aria-hidden
                  />
                  <select
                    value={stat.accentColor}
                    onChange={(e) =>
                      updateStat(index, { accentColor: e.target.value })
                    }
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                  >
                    {ACCENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.value})
                      </option>
                    ))}
                    {!ACCENT_OPTIONS.some((o) => o.value === stat.accentColor) ? (
                      <option value={stat.accentColor}>
                        Custom ({stat.accentColor})
                      </option>
                    ) : null}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Object position</Label>
                <Input
                  value={stat.objectPosition ?? "center center"}
                  onChange={(e) =>
                    updateStat(index, { objectPosition: e.target.value })
                  }
                  placeholder="center 40%"
                />
              </div>
            </div>

            <ImageField
              label="Panel image"
              value={stat.image?.src ?? ""}
              onChange={(url) =>
                updateStat(index, {
                  image: {
                    src: url,
                    alt: stat.image?.alt ?? {
                      en: "",
                      "pt-BR": "",
                      es: "",
                      "zh-CN": "",
                    },
                  },
                })
              }
            />
            <LocalizedField
              label="Image alt"
              locale={locale}
              value={stat.image?.alt?.[locale] ?? ""}
              onChange={(v) =>
                updateStat(index, {
                  image: {
                    src: stat.image?.src ?? "",
                    alt: {
                      ...(stat.image?.alt ?? {
                        en: "",
                        "pt-BR": "",
                        es: "",
                        "zh-CN": "",
                      }),
                      [locale]: v,
                    },
                  },
                })
              }
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
