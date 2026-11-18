"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LocalizedInput,
  updateSettingsLocalized,
  type HomepageSectionEditorProps,
} from "../shared";

export function GlobalPresenceSectionEditor({
  settings,
  setSettings,
  locale,
}: HomepageSectionEditorProps) {
  const t = useTranslations("admin.website.home");
  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>{t("fields.sectionTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Only the section title is editable. The interactive map is locked to the final production
          version.
        </p>
        <LocalizedInput
          label={t("fields.sectionTitle")}
          locale={locale}
          value={settings.globalPresence.title[locale]}
          onChange={(l, v) => updateSettingsLocalized(setSettings, "globalPresence", "title", l, v)}
          multiline
        />
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="gp-show-connections">{t("fields.showConnections")}</Label>
            <p className="text-sm text-muted-foreground">{t("fields.showConnectionsHint")}</p>
          </div>
          <Switch
            id="gp-show-connections"
            checked={settings.globalPresence.showConnections !== false}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({
                ...prev,
                globalPresence: { ...prev.globalPresence, showConnections: checked },
              }))
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
