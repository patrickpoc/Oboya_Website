"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageField } from "@/components/admin/media/ImageField";
import type { HomepagePartnerLogo } from "@/lib/cms/repositories/homepage-repository";
import {
  LocalizedInput,
  newId,
  updateSettingsLocalized,
  type HomepageSectionEditorProps,
} from "../shared";

export function PartnersSectionEditor({
  settings,
  setSettings,
  locale,
}: HomepageSectionEditorProps) {
  const t = useTranslations("admin.website.home");
  const tCommon = useTranslations("admin.common");
  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>{t("sections.partners.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LocalizedInput
          label={t("fields.sectionTitle")}
          locale={locale}
          value={settings.partners.title[locale]}
          onChange={(l, v) => updateSettingsLocalized(setSettings, "partners", "title", l, v)}
        />
        {settings.partners.logos.map((logo, index) => (
          <div key={logo.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Logo {index + 1}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const logos = settings.partners.logos.filter((_, i) => i !== index);
                  setSettings({
                    ...settings,
                    partners: { ...settings.partners, logos },
                  });
                }}
              >
                Remove
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{tCommon("name")}</Label>
                <Input
                  value={logo.name}
                  onChange={(e) => {
                    const logos = [...settings.partners.logos];
                    logos[index] = { ...logo, name: e.target.value };
                    setSettings({
                      ...settings,
                      partners: { ...settings.partners, logos },
                    });
                  }}
                />
              </div>
              <ImageField
                label={t("fields.logoImage")}
                value={logo.image}
                onChange={(url) => {
                  const logos = [...settings.partners.logos];
                  logos[index] = { ...logo, image: url };
                  setSettings({
                    ...settings,
                    partners: { ...settings.partners, logos },
                  });
                }}
                optional
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("fields.linkOptional")}</Label>
              <Input
                value={logo.href ?? ""}
                onChange={(e) => {
                  const logos = [...settings.partners.logos];
                  logos[index] = { ...logo, href: e.target.value };
                  setSettings({
                    ...settings,
                    partners: { ...settings.partners, logos },
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
            const logo: HomepagePartnerLogo = {
              id: newId(),
              name: "",
              image: "",
              href: "",
            };
            setSettings({
              ...settings,
              partners: {
                ...settings.partners,
                logos: [...settings.partners.logos, logo],
              },
            });
          }}
        >
          Add logo
        </Button>
      </CardContent>
    </Card>
  );
}
