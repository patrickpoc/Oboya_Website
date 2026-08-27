"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/admin/permissions/Can";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";

export default function AboutPageAdmin() {
  const [settings, setSettings] = useState<AboutPageSettings | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleSave = async () => {
    if (!settings) return;
    try {
      const res = await fetch("/api/cms/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("About page settings saved");
    } catch {
      toast.error("Failed to save about page settings");
    }
  };

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
          description="CMS content for /about — hero, timeline, culture, mission, vision, values and honors."
        />

        <div className="grid max-w-3xl gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Content overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Timeline events: {settings.timeline.events.length} · Culture
                items: {settings.culture.items.length} · Values:{" "}
                {settings.values.items.length} · Honors:{" "}
                {settings.honors.items.length}
              </p>
              <p>
                Mission images: {settings.mission.images.length} · Vision
                images: {settings.vision.images.length}
              </p>
              <Button type="button" onClick={handleSave}>
                Save settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Can>
  );
}
