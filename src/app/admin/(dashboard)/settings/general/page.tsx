"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/constants/site";

export default function GeneralSettingsPage() {
  const t = useTranslations("admin.settings.general");
  const tCommon = useTranslations("admin.common");
  const [settings, setSettings] = useState({
    name: siteConfig.name,
    shortName: siteConfig.shortName,
    description: siteConfig.description,
    url: siteConfig.url,
    email: siteConfig.company.email,
    phone: siteConfig.company.phone,
    address: siteConfig.company.address,
    linkedin: siteConfig.social.linkedin as string,
    facebook: siteConfig.social.facebook as string,
    gaId: "",
    gtmId: "",
  });

  const handleSave = () => {
    toast.success(t("saved"));
  };

  const companyFields = [
    ["name", t("companyName")],
    ["shortName", t("shortName")],
    ["description", tCommon("description")],
    ["url", t("websiteUrl")],
    ["email", tCommon("email")],
    ["phone", tCommon("phone")],
    ["address", tCommon("address")],
  ] as const;

  return (
    <div>
      <AdminPageHeader title={t("title")} description={t("description")} />

      <div className="grid max-w-2xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("company")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {companyFields.map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  value={settings[key]}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("socialAnalytics")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("linkedin")}</Label>
              <Input
                value={settings.linkedin}
                onChange={(e) => setSettings({ ...settings, linkedin: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("facebook")}</Label>
              <Input
                value={settings.facebook}
                onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("gaId")}</Label>
              <Input
                value={settings.gaId}
                onChange={(e) => setSettings({ ...settings, gaId: e.target.value })}
                placeholder="G-XXXXXXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("gtmId")}</Label>
              <Input
                value={settings.gtmId}
                onChange={(e) => setSettings({ ...settings, gtmId: e.target.value })}
                placeholder="GTM-XXXXXXX"
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-fit rounded-full bg-oboya-green">
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
