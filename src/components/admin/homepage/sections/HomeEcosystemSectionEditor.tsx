"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageField } from "@/components/admin/media/ImageField";
import {
  type HomeEcosystemStage,
  type HomepageSettings,
  sanitizeHomeEcosystemImage,
} from "@/lib/cms/repositories/homepage-repository";
import {
  LocalizedInput,
  updateLocalizedField,
  type HomepageSectionEditorProps,
} from "../shared";

type Eco = HomepageSettings["homeEcosystem"];
type TextKey =
  | "title"
  | "bodyP1"
  | "bodyP2"
  | "openingLine"
  | "closingLine1"
  | "closingLine2"
  | "slogan";

export function HomeEcosystemSectionEditor({
  settings,
  setSettings,
  locale,
}: HomepageSectionEditorProps) {
  const t = useTranslations("admin.website.home");
  const tCommon = useTranslations("admin.common");
  const section = settings.homeEcosystem;

  const patch = (p: Partial<Eco>) =>
    setSettings((prev) => ({ ...prev, homeEcosystem: { ...prev.homeEcosystem, ...p } }));

  const patchStage = (id: HomeEcosystemStage["id"], p: Partial<HomeEcosystemStage>) =>
    setSettings((prev) => ({
      ...prev,
      homeEcosystem: {
        ...prev.homeEcosystem,
        stages: prev.homeEcosystem.stages.map((s) => (s.id === id ? { ...s, ...p } : s)),
      },
    }));

  const textField = (key: TextKey, label: string, multiline?: boolean) => (
    <LocalizedInput
      label={label}
      locale={locale}
      value={section[key][locale]}
      onChange={(l, v) => patch({ [key]: updateLocalizedField(section[key], l, v) })}
      multiline={multiline}
    />
  );

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>{t("sections.homeEcosystem.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {textField("title", tCommon("title"), true)}
        {textField("bodyP1", t("fields.ecosystemBodyP1"), true)}
        {textField("bodyP2", t("fields.ecosystemBodyP2"), true)}
        {textField("openingLine", t("fields.ecosystemOpeningLine"))}

        {section.stages.map((stage, index) => (
          <div key={stage.id} className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">
              {index + 1}. {stage.label[locale] || stage.id}
            </p>
            <LocalizedInput
              label={t("fields.ecosystemStageLabel")}
              locale={locale}
              value={stage.label[locale]}
              onChange={(l, v) =>
                patchStage(stage.id, { label: updateLocalizedField(stage.label, l, v) })
              }
            />
            <ImageField
              label={t("fields.ecosystemStageImage")}
              value={stage.image}
              onChange={(url) => patchStage(stage.id, { image: url })}
              optional
            />
            {stage.image.trim() && !sanitizeHomeEcosystemImage(stage.image) && (
              <p role="alert" className="text-xs text-destructive">
                {t("fields.ecosystemStageImageInvalid")}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("fields.ecosystemStageImageHint")}
            </p>
          </div>
        ))}

        {textField("closingLine1", t("fields.ecosystemClosingLine1"))}
        {textField("closingLine2", t("fields.ecosystemClosingLine2"))}
        {textField("slogan", t("fields.ecosystemSlogan"))}
      </CardContent>
    </Card>
  );
}
