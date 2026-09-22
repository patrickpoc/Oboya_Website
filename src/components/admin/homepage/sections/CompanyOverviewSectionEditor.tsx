"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("admin.website.home");
  const tCommon = useTranslations("admin.common");
  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>{t("fields.statsMissionTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">{t("fields.segmentsHint")}</p>
        {settings.companyOverview.segments.map((segment, index) => (
          <div key={index} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {t("fields.segmentN", { index: index + 1 })}
              </p>
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
                {tCommon("remove")}
              </Button>
            </div>
            <LocalizedInput
              label={t("fields.text")}
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
                <Label>{t("fields.tone")}</Label>
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
                  <option value="green">{t("fields.toneGreen")}</option>
                  <option value="white">{t("fields.toneWhite")}</option>
                </select>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
                <Label htmlFor={`segment-break-${index}`}>
                  {t("fields.lineBreakBefore")}
                </Label>
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
          {t("fields.addSegment")}
        </Button>
        <LocalizedInput
          label={t("fields.headlineGreenDeprecated")}
          locale={locale}
          value={settings.companyOverview.headlineGreen[locale]}
          onChange={(l, v) =>
            updateSettingsLocalized(setSettings, "companyOverview", "headlineGreen", l, v)
          }
        />
        <LocalizedInput
          label={t("fields.headlineWhiteDeprecated")}
          locale={locale}
          value={settings.companyOverview.headlineWhite[locale]}
          onChange={(l, v) =>
            updateSettingsLocalized(setSettings, "companyOverview", "headlineWhite", l, v)
          }
        />
        <ImageField
          label={t("fields.missionImage")}
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
          label={t("fields.imageAltText")}
          locale={locale}
          value={settings.companyOverview.imageAlt[locale]}
          onChange={(l, v) =>
            updateSettingsLocalized(setSettings, "companyOverview", "imageAlt", l, v)
          }
        />
        {settings.companyOverview.stats.map((stat, index) => (
          <div key={stat.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {t("fields.statN", { index: index + 1 })}
              </p>
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
                {tCommon("remove")}
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>{tCommon("value")}</Label>
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
                <Label>{tCommon("suffix")}</Label>
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
                label={tCommon("label")}
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
          {t("fields.addStat")}
        </Button>
      </CardContent>
    </Card>
  );
}
