"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { LocaleFieldTabs } from "@/components/admin/forms/LocaleFieldTabs";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/admin/permissions/Can";
import {
  getHomepageSettings,
  type HomepageSettings,
} from "@/lib/cms/repositories/homepage-repository";
import type { HomepageSectionSlug } from "@/lib/cms/homepage-sections";
import type { CmsLocale } from "@/lib/cms/types";
import type { HomepageSectionEditorProps } from "./shared";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";

type HomepageSectionShellProps = {
  section: HomepageSectionSlug;
  children: (props: HomepageSectionEditorProps) => ReactNode;
};

export function HomepageSectionShell({ section, children }: HomepageSectionShellProps) {
  const t = useTranslations("admin.website.home");
  const tCommon = useTranslations("admin.common");
  const [settings, setSettings] = useState<HomepageSettings>(getHomepageSettings());
  const [locale, setLocale] = useState<CmsLocale>("en");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/cms/homepage");
        if (!res.ok) return;
        const data = (await res.json()) as HomepageSettings;
        if (!cancelled && data?.hero) {
          setSettings(data);
        }
      } catch {
        // Keep seed defaults.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistSettings = useCallback(
    async (next?: HomepageSettings) => {
      const payload = next ?? settings;
      setSaving(true);
      try {
        const res = await fetch("/api/cms/homepage", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as HomepageSettings & { error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? tCommon("saveFailed"));
        }
        setSettings(data);
        toast.success(t("saved"));
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("saveFailed"));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [settings, t, tCommon]
  );

  const handleSave = () => {
    void persistSettings();
  };

  return (
    <Can module="website" action="edit" fallback={<AccessDenied />}>
      <div>
        <Link
          href="/admin/website/home"
          className="mb-4 inline-flex text-sm text-muted-foreground transition-colors hover:text-oboya-blue-dark"
        >
          {t("backToSections")}
        </Link>

        <AdminPageHeader
          title={t(`sections.${section}.title`)}
          description={t(`sections.${section}.description`)}
          actions={
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-oboya-green hover:bg-oboya-green/90"
            >
              {saving ? tCommon("saving") : tCommon("save")}
            </Button>
          }
        />

        <LocaleFieldTabs value={locale} onChange={setLocale}>
          {(loc) =>
            children({
              settings,
              setSettings,
              locale: loc,
              persistSettings,
            })
          }
        </LocaleFieldTabs>
      </div>
    </Can>
  );
}
