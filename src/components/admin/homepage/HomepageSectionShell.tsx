"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { LocaleFieldTabs } from "@/components/admin/forms/LocaleFieldTabs";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/admin/permissions/Can";
import {
  replaceHomepageSettingsCache,
  type HomepageSettings,
} from "@/lib/cms/repositories/homepage-repository";
import {
  HOMEPAGE_SECTION_META,
  type HomepageSectionSlug,
} from "@/lib/cms/homepage-sections";
import type { CmsLocale } from "@/lib/cms/types";
import type { HomepageSectionEditorProps } from "./shared";

type HomepageSectionShellProps = {
  section: HomepageSectionSlug;
  children: (props: HomepageSectionEditorProps) => ReactNode;
};

export function HomepageSectionShell({
  section,
  children,
}: HomepageSectionShellProps) {
  const meta = HOMEPAGE_SECTION_META[section];
  // Start empty so SSR/client don't hydrate-mismatch on Date.now() defaults.
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [locale, setLocale] = useState<CmsLocale>("en");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/cms/homepage", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to load homepage settings");
        }
        const data = (await response.json()) as HomepageSettings;
        if (!cancelled) {
          replaceHomepageSettingsCache(data);
          setSettings(data);
          setLoadError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Failed to load homepage settings"
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const response = await fetch("/api/cms/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Failed to save homepage");
      }
      const saved = (await response.json()) as HomepageSettings;
      replaceHomepageSettingsCache(saved);
      setSettings(saved);
      toast.success("Homepage saved — live site will update shortly");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save homepage"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Can
      module="website"
      action="edit"
      fallback={<p className="text-sm text-muted-foreground">Access denied.</p>}
    >
      <div>
        <Link
          href="/admin/website/home"
          className="mb-4 inline-flex text-sm text-muted-foreground transition-colors hover:text-oboya-blue-dark"
        >
          ← All homepage sections
        </Link>

        <AdminPageHeader
          title={meta.title}
          description={meta.description}
          actions={
            <Button
              onClick={() => void handleSave()}
              disabled={saving || !settings}
              className="rounded-full bg-oboya-green hover:bg-oboya-green/90"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          }
        />

        {!settings && !loadError ? (
          <p className="text-sm text-muted-foreground">Loading saved content…</p>
        ) : null}

        {loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : null}

        {settings ? (
          <LocaleFieldTabs value={locale} onChange={setLocale}>
            {(loc) => children({ settings, setSettings, locale: loc })}
          </LocaleFieldTabs>
        ) : null}
      </div>
    </Can>
  );
}
