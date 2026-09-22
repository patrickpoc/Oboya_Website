"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { LocaleFieldTabs } from "@/components/admin/forms/LocaleFieldTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { NewsPageSettings } from "@/lib/cms/repositories/news-page-repository";
import type { CmsLocale } from "@/lib/cms/types";
import { Can } from "@/components/admin/permissions/Can";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";

export default function NewsPageAdmin() {
  const t = useTranslations("admin.website.news");
  const tCommon = useTranslations("admin.common");
  const [settings, setSettings] = useState<NewsPageSettings | null>(null);
  const [locale, setLocale] = useState<CmsLocale>("en");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/cms/news-page");
        if (!res.ok) throw new Error(tCommon("loadFailed"));
        setSettings(await res.json());
      } catch {
        toast.error(t("loadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    try {
      const res = await fetch("/api/cms/news-page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error(tCommon("saveFailed"));
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  if (loading || !settings) {
    return <div className="min-h-[40vh]" aria-hidden />;
  }

  return (
    <Can module="website" action="edit" fallback={<AccessDenied />}>
      <div>
        <AdminPageHeader
          title={t("title")}
          description={t("description")}
        />

        <div className="grid max-w-3xl gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("heroSection")}</CardTitle>
            </CardHeader>
            <CardContent>
              <LocaleFieldTabs value={locale} onChange={setLocale}>
                {(loc) => (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>{t("eyebrowLabel")}</Label>
                      <Input
                        value={settings.eyebrow[loc]}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            eyebrow: { ...settings.eyebrow, [loc]: e.target.value },
                          })
                        }
                        placeholder={t("eyebrowPlaceholder")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{tCommon("title")}</Label>
                      <textarea
                        value={settings.headline[loc]}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            headline: { ...settings.headline, [loc]: e.target.value },
                          })
                        }
                        rows={4}
                        className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                        placeholder={t("headlinePlaceholder")}
                      />
                    </div>
                  </div>
                )}
              </LocaleFieldTabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("listing")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t("postsPerPage")}</Label>
                <Input
                  type="number"
                  min={3}
                  max={12}
                  value={settings.postsPerPage}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      postsPerPage: Number(e.target.value) || 6,
                    })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("listingHint")}
              </p>
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-fit rounded-full bg-oboya-green">
            {t("save")}
          </Button>
        </div>
      </div>
    </Can>
  );
}
