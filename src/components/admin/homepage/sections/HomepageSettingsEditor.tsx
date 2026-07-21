"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { HomepageSectionId } from "@/lib/cms/repositories/homepage-repository";
import { HOMEPAGE_SECTION_META } from "@/lib/cms/homepage-sections";
import type { HomepageSectionEditorProps } from "../shared";

const VISIBILITY_SECTION_IDS: HomepageSectionId[] = [
  "hero",
  "companyOverview",
  "capabilities",
  "globalPresence",
  "testimonials",
  "featuredProducts",
  "latestNews",
  "partners",
];

export function HomepageSettingsEditor({ settings, setSettings }: HomepageSectionEditorProps) {
  const toggleSection = (id: HomepageSectionId) => {
    setSettings((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [id]: { enabled: !prev.sections[id].enabled },
      },
    }));
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Section visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {VISIBILITY_SECTION_IDS.map((id) => (
            <div key={id} className="flex items-center justify-between gap-4">
              <Label htmlFor={`section-${id}`}>{HOMEPAGE_SECTION_META[id].title}</Label>
              <Switch
                id={`section-${id}`}
                checked={settings.sections[id].enabled}
                onCheckedChange={() => toggleSection(id)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Animations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="animations-enabled">
              Enable homepage animations (marquees, motion, counters)
            </Label>
            <Switch
              id="animations-enabled"
              checked={settings.animations?.enabled ?? true}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  animations: { enabled: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
