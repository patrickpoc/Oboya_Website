"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { LocaleFieldTabs } from "@/components/admin/forms/LocaleFieldTabs";
import { ImpactSectionEditor } from "@/components/admin/about/ImpactSectionEditor";
import { ValuesSectionEditor } from "@/components/admin/about/ValuesSectionEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Can } from "@/components/admin/permissions/Can";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import type { CmsLocale } from "@/lib/cms/types";

export default function AboutPageAdmin() {
  const [settings, setSettings] = useState<AboutPageSettings | null>(null);
  const [locale, setLocale] = useState<CmsLocale>("en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/cms/about");
        if (!res.ok) throw new Error("Failed to load");
        setSettings(await res.json());
      } catch {
        toast.error("Could not load about page settings");
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
        throw new Error(data.error ?? "Save failed");
      }
      setSettings(data);
      toast.success("About page saved to live CMS");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save about page settings"
      );
    } finally {
      setSaving(false);
    }
  }, [settings]);

  if (loading || !settings) {
    return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <Can
      module="website"
      action="edit"
      fallback={
        <p className="text-sm text-muted-foreground">Access denied.</p>
      }
    >
      <div>
        <AdminPageHeader
          title="About Us"
          description="Edit Oboya in Numbers, Values, and related About content. Saves to Supabase cms_documents (about-page) when configured — not browser cache."
          actions={
            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-full bg-oboya-green hover:bg-oboya-green/90"
            >
              {saving ? "Saving…" : "Save"}
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
                  <CardTitle>Other sections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Timeline: {settings.timeline.events.length} events · Culture:{" "}
                    {settings.culture.items.length} · Honors:{" "}
                    {settings.honors.items.length}
                  </p>
                  <p>
                    Mission images: {settings.mission.images.length} · Vision
                    images: {settings.vision.images.length}
                  </p>
                  <p className="text-xs">
                    Hero, timeline, callout, culture, mission, vision, and honors
                    still use the shared About document — expand editors here as
                    needed. Save persists the full document.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </LocaleFieldTabs>
      </div>
    </Can>
  );
}
