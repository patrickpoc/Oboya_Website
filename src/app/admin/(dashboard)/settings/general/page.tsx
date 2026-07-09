"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/constants/site";

export default function GeneralSettingsPage() {
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
    toast.success("Settings saved (mock — ready for API integration)");
  };

  return (
    <div>
      <AdminPageHeader
        title="General Settings"
        description="Company information, branding and global configuration."
      />

      <div className="grid max-w-2xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Company</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                ["name", "Company name"],
                ["shortName", "Short name"],
                ["description", "Description"],
                ["url", "Website URL"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["address", "Address"],
              ] as const
            ).map(([key, label]) => (
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
            <CardTitle>Social & Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>LinkedIn</Label>
              <Input
                value={settings.linkedin}
                onChange={(e) => setSettings({ ...settings, linkedin: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Facebook</Label>
              <Input
                value={settings.facebook}
                onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Google Analytics ID</Label>
              <Input
                value={settings.gaId}
                onChange={(e) => setSettings({ ...settings, gaId: e.target.value })}
                placeholder="G-XXXXXXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Google Tag Manager ID</Label>
              <Input
                value={settings.gtmId}
                onChange={(e) => setSettings({ ...settings, gtmId: e.target.value })}
                placeholder="GTM-XXXXXXX"
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-fit rounded-full bg-oboya-green">
          Save settings
        </Button>
      </div>
    </div>
  );
}
