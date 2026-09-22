"use client";

import { useTranslations } from "next-intl";
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
  const tCommon = useTranslations("admin.common");
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
      </CardContent>
    </Card>
  );
}
