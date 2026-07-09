"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const SECTIONS = [
  { id: "hero", label: "Hero", enabled: true },
  { id: "companyOverview", label: "Company Overview", enabled: true },
  { id: "globalPresence", label: "Global Presence / Map", enabled: true },
  { id: "featuredProducts", label: "Featured Products", enabled: true },
  { id: "innovation", label: "Innovation", enabled: true },
  { id: "news", label: "News", enabled: true },
  { id: "certifications", label: "Certifications", enabled: true },
  { id: "cta", label: "Call to Action", enabled: true },
];

export default function HomePageAdmin() {
  const [sections, setSections] = useState(SECTIONS);

  const toggle = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleSave = () => {
    toast.success("Homepage sections saved (mock)");
  };

  return (
    <div>
      <AdminPageHeader
        title="Homepage"
        description="Manage homepage sections, order and visibility."
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Section visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="flex items-center justify-between">
              <Label htmlFor={section.id}>{section.label}</Label>
              <Switch
                id={section.id}
                checked={section.enabled}
                onCheckedChange={() => toggle(section.id)}
              />
            </div>
          ))}
          <Button onClick={handleSave} className="mt-4 rounded-full bg-oboya-green">
            Save sections
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
