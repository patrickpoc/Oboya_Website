"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ImageField } from "@/components/admin/media/ImageField";
import type {
  HomepageHeadlineSegment,
  HomepageStat,
} from "@/lib/cms/repositories/homepage-repository";
import {
  LocalizedInput,
  emptyLocalized,
  newId,
  updateSettingsLocalized,
  type HomepageSectionEditorProps,
} from "../shared";

export function CompanyOverviewSectionEditor({
  settings,
  setSettings,
  locale,
}: HomepageSectionEditorProps) {
  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Statistics & Mission</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Headline segments control multi-color line breaks. Deprecated green/white fields remain
          as fallback when no segments exist.
        </p>
        {settings.companyOverview.segments.map((segment, index) => (
          <div key={index} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Segment {index + 1}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const segments = settings.companyOverview.segments.filter(
                    (_, i) => i !== index
                  );
                  setSettings({
                    ...settings,
                    companyOverview: {
                      ...settings.companyOverview,
                      segments,
                    },
                  });
                }}
              >
                Remove
              </Button>
            </div>
            <LocalizedInput
              label="Text"
              locale={locale}
              value={segment.text[locale]}
              onChange={(_, v) => {
                const segments = [...settings.companyOverview.segments];
                segments[index] = {
                  ...segment,
                  text: { ...segment.text, [locale]: v },
                };
                setSettings({
                  ...settings,
                  companyOverview: {
                    ...settings.companyOverview,
                    segments,
                  },
                });
              }}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tone</Label>
                <select
                  value={segment.tone}
                  onChange={(e) => {
                    const segments = [...settings.companyOverview.segments];
                    segments[index] = {
                      ...segment,
                      tone: e.target.value as HomepageHeadlineSegment["tone"],
                    };
                    setSettings({
                      ...settings,
                      companyOverview: {
                        ...settings.companyOverview,
                        segments,
                      },
                    });
                  }}
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                >
                  <option value="green">green</option>
                  <option value="white">white</option>
                </select>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
                <Label htmlFor={`segment-break-${index}`}>Line break before</Label>
                <Switch
                  id={`segment-break-${index}`}
                  checked={segment.breakBefore ?? index > 0}
                  onCheckedChange={(checked) => {
                    const segments = [...settings.companyOverview.segments];
                    segments[index] = { ...segment, breakBefore: checked };
                    setSettings({
                      ...settings,
                      companyOverview: {
                        ...settings.companyOverview,
                        segments,
                      },
                    });
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
            const segment: HomepageHeadlineSegment = {
              text: emptyLocalized(),
              tone: "white",
              breakBefore: settings.companyOverview.segments.length > 0,
            };
            setSettings({
              ...settings,
              companyOverview: {
                ...settings.companyOverview,
                segments: [...settings.companyOverview.segments, segment],
              },
            });
          }}
        >
          Add segment
        </Button>
        <LocalizedInput
          label="Headline (green part, deprecated)"
          locale={locale}
          value={settings.companyOverview.headlineGreen[locale]}
          onChange={(l, v) =>
            updateSettingsLocalized(setSettings, "companyOverview", "headlineGreen", l, v)
          }
        />
        <LocalizedInput
          label="Headline (white part, deprecated)"
          locale={locale}
          value={settings.companyOverview.headlineWhite[locale]}
          onChange={(l, v) =>
            updateSettingsLocalized(setSettings, "companyOverview", "headlineWhite", l, v)
          }
        />
        <ImageField
          label="Mission image"
          value={settings.companyOverview.image}
          onChange={(url) =>
            setSettings({
              ...settings,
              companyOverview: {
                ...settings.companyOverview,
                image: url,
              },
            })
          }
        />
        <LocalizedInput
          label="Image alt text"
          locale={locale}
          value={settings.companyOverview.imageAlt[locale]}
          onChange={(l, v) =>
            updateSettingsLocalized(setSettings, "companyOverview", "imageAlt", l, v)
          }
        />
        {settings.companyOverview.stats.map((stat, index) => (
          <div key={stat.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Stat {index + 1}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const stats = settings.companyOverview.stats.filter((_, i) => i !== index);
                  setSettings({
                    ...settings,
                    companyOverview: { ...settings.companyOverview, stats },
                  });
                }}
              >
                Remove
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Value</Label>
                <Input
                  type="number"
                  value={stat.value}
                  onChange={(e) => {
                    const stats = [...settings.companyOverview.stats];
                    stats[index] = { ...stat, value: Number(e.target.value) };
                    setSettings({
                      ...settings,
                      companyOverview: { ...settings.companyOverview, stats },
                    });
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Suffix</Label>
                <Input
                  value={stat.suffix}
                  onChange={(e) => {
                    const stats = [...settings.companyOverview.stats];
                    stats[index] = { ...stat, suffix: e.target.value };
                    setSettings({
                      ...settings,
                      companyOverview: { ...settings.companyOverview, stats },
                    });
                  }}
                />
              </div>
              <LocalizedInput
                label="Label"
                locale={locale}
                value={stat.label[locale]}
                onChange={(_, v) => {
                  const stats = [...settings.companyOverview.stats];
                  stats[index] = {
                    ...stat,
                    label: { ...stat.label, [locale]: v },
                  };
                  setSettings({
                    ...settings,
                    companyOverview: { ...settings.companyOverview, stats },
                  });
                }}
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const stat: HomepageStat = {
              id: newId(),
              value: 0,
              suffix: "+",
              label: emptyLocalized(),
            };
            setSettings({
              ...settings,
              companyOverview: {
                ...settings.companyOverview,
                stats: [...settings.companyOverview.stats, stat],
              },
            });
          }}
        >
          Add stat
        </Button>
      </CardContent>
    </Card>
  );
}
