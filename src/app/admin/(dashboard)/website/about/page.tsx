"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/admin/permissions/Can";
import {
  getAboutPageSettings,
  type AboutPageSettings,
} from "@/lib/cms/repositories/about-page-repository";

export default function AboutPageAdmin() {
  const [settings] = useState<AboutPageSettings>(getAboutPageSettings());

  const handleSave = async () => {
    try {
      await fetch("/api/cms/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      toast.success("About page settings saved");
    } catch {
      toast.error("Failed to save about page settings");
    }
  };

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
          description="CMS content for /about — hero, timeline, impact, people, culture and honors."
        />

        <div className="grid max-w-3xl gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Content overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Timeline events: {settings.timeline.events.length} · Culture
                items: {settings.culture.items.length} · Honors:{" "}
                {settings.honors.items.length}
              </p>
              <p>
                Impact stats: {settings.impact.stats.length} · People:{" "}
                {settings.people.items.length}
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
