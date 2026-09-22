"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { LocaleFieldTabs } from "@/components/admin/forms/LocaleFieldTabs";
import { ImpactSectionEditor } from "@/components/admin/about/ImpactSectionEditor";
import { ValuesSectionEditor } from "@/components/admin/about/ValuesSectionEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Can } from "@/components/admin/permissions/Can";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import type { CmsLocale } from "@/lib/cms/types";

export default function AboutPageAdmin() {
  const t = useTranslations("admin.website.about");
  const tCommon = useTranslations("admin.common");
  const [settings, setSettings] = useState<AboutPageSettings | null>(null);
  const [locale, setLocale] = useState<CmsLocale>("en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/cms/about");
        if (!res.ok) throw new Error(tCommon("loadFailed"));
        setSettings(await res.json());
      } catch {
        toast.error(t("loadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/cms/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = (await res.json()) as AboutPageSettings & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? tCommon("saveFailed"));
      }
      setSettings(data);
      toast.success(t("saved"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("saveFailed")
      );
    } finally {
      setSaving(false);
    }
  }, [settings]);

  if (loading || !settings) {
    return <div className="min-h-[40vh]" aria-hidden />;
  }

  return (
    <Can
      module="website"
      action="edit"
      fallback={
        <AccessDenied />
      }
    >
      <div>
        <AdminPageHeader
          title={t("title")}
          description={t("description")}
          actions={
            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-full bg-oboya-green hover:bg-oboya-green/90"
            >
              {saving ? tCommon("saving") : tCommon("save")}
            </Button>
          }
        />

        <LocaleFieldTabs value={locale} onChange={setLocale}>
          {(loc) => (
            <div className="grid max-w-4xl gap-6">
              <ImpactSectionEditor
                settings={settings}
                setSettings={(next) => {
                  setSettings((prev) => {
                    if (!prev) return prev;
                    return typeof next === "function" ? next(prev) : next;
                  });
                }}
                locale={loc}
              />
              <ValuesSectionEditor
                settings={settings}
                setSettings={(next) => {
                  setSettings((prev) => {
                    if (!prev) return prev;
                    return typeof next === "function" ? next(prev) : next;
                  });
                }}
                locale={loc}
              />
              <Card>
                <CardHeader>
                  <CardTitle>{t("otherSections")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    {t("otherSectionsStats", {
                      timeline: settings.timeline.events.length,
                      culture: settings.culture.items.length,
                      honors: settings.honors.items.length,
                    })}
                  </p>
                  <p>
                    {t("otherSectionsImages", {
                      mission: settings.mission.images.length,
                      vision: settings.vision.images.length,
                    })}
                  </p>
                  <p className="text-xs">{t("otherSectionsHint")}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </LocaleFieldTabs>
      </div>
    </Can>
  );
}
