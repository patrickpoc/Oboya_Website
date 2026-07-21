"use client";

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
  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Latest News</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LocalizedInput
          label="Eyebrow"
          locale={locale}
          value={settings.latestNews.eyebrow[locale]}
          onChange={(l, v) => updateSettingsLocalized(setSettings, "latestNews", "eyebrow", l, v)}
        />
        <LocalizedInput
          label="Headline"
          locale={locale}
          value={settings.latestNews.headline[locale]}
          onChange={(l, v) => updateSettingsLocalized(setSettings, "latestNews", "headline", l, v)}
          multiline
        />
        <div className="space-y-1.5">
          <Label>Number of posts on homepage</Label>
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
        <p className="text-xs text-muted-foreground">Articles are managed under Blog → Posts.</p>
      </CardContent>
    </Card>
  );
}
