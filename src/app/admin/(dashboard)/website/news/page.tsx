"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { LocaleFieldTabs } from "@/components/admin/forms/LocaleFieldTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  getNewsPageSettings,
  saveNewsPageSettings,
  type NewsPageSettings,
} from "@/lib/cms/repositories/news-page-repository";
import type { CmsLocale } from "@/lib/cms/types";
import { Can } from "@/components/admin/permissions/Can";

export default function NewsPageAdmin() {
  const [settings, setSettings] = useState<NewsPageSettings>(getNewsPageSettings());
  const [locale, setLocale] = useState<CmsLocale>("en");

  const handleSave = async () => {
    saveNewsPageSettings(settings);
    try {
      await fetch("/api/cms/news-page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    } catch {
      // In-memory save still applies for dev
    }
    toast.success("News page settings saved");
  };

  return (
    <Can module="website" action="edit" fallback={<p className="text-sm text-muted-foreground">Access denied.</p>}>
      <div>
        <AdminPageHeader
          title="News Page"
          description="Edit the hero section and listing settings for /news."
        />

        <div className="grid max-w-3xl gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero section</CardTitle>
            </CardHeader>
            <CardContent>
              <LocaleFieldTabs value={locale} onChange={setLocale}>
                {(loc) => (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Eyebrow label</Label>
                      <Input
                        value={settings.eyebrow[loc]}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            eyebrow: { ...settings.eyebrow, [loc]: e.target.value },
                          })
                        }
                        placeholder="Latest News"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Headline</Label>
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
                        placeholder="Main headline shown on the news listing page"
                      />
                    </div>
                  </div>
                )}
              </LocaleFieldTabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Listing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Posts per page</Label>
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
                Articles are managed under Blog → Posts. Categories control the filter dropdown.
              </p>
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-fit rounded-full bg-oboya-green">
            Save news page
          </Button>
        </div>
      </div>
    </Can>
  );
}
