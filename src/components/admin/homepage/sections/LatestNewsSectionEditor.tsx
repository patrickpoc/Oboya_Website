"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LocalizedInput,
  updateSettingsLocalized,
  type HomepageSectionEditorProps,
} from "../shared";

export function LatestNewsSectionEditor({
  settings,
  setSettings,
  locale,
}: HomepageSectionEditorProps) {
  const t = useTranslations("admin.website.home");
  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>{t("sections.latestNews.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LocalizedInput
          label={t("fields.eyebrow")}
          locale={locale}
          value={settings.latestNews.eyebrow[locale]}
          onChange={(l, v) => updateSettingsLocalized(setSettings, "latestNews", "eyebrow", l, v)}
        />
        <LocalizedInput
          label={t("fields.headline")}
          locale={locale}
          value={settings.latestNews.headline[locale]}
          onChange={(l, v) => updateSettingsLocalized(setSettings, "latestNews", "headline", l, v)}
          multiline
        />
        <div className="space-y-1.5">
          <Label>{t("fields.postsToShow")}</Label>
          <Input
            type="number"
            min={1}
            max={4}
            value={settings.latestNews.postCount}
            onChange={(e) =>
              setSettings({
                ...settings,
                latestNews: {
                  ...settings.latestNews,
                  postCount: Number(e.target.value) || 2,
                },
              })
            }
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("fields.articlesManagedHint")}</p>
      </CardContent>
    </Card>
  );
}
