"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageField } from "@/components/admin/media/ImageField";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import type { CmsLocale } from "@/lib/cms/types";
import type { Dispatch, SetStateAction } from "react";

export type ValuesSectionEditorProps = {
  settings: AboutPageSettings;
  setSettings: Dispatch<SetStateAction<AboutPageSettings>>;
  locale: CmsLocale;
};

export function ValuesSectionEditor({
  settings,
  setSettings,
  locale,
}: ValuesSectionEditorProps) {
  const values = settings.values;

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Values</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
          <Label htmlFor="values-enabled">Section enabled</Label>
          <Switch
            id="values-enabled"
            checked={settings.sections.values.enabled}
            onCheckedChange={(checked) =>
              setSettings({
                ...settings,
                sections: {
                  ...settings.sections,
                  values: { enabled: checked },
                },
              })
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label>
            Section title{" "}
            <span className="text-muted-foreground">({locale})</span>
          </Label>
          <Input
            value={values.title[locale] ?? ""}
            onChange={(e) =>
              setSettings({
                ...settings,
                values: {
                  ...values,
                  title: { ...values.title, [locale]: e.target.value },
                },
              })
            }
          />
        </div>

        {values.items.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium capitalize">
              {item.id.replace(/-/g, " ")}
            </p>
            <div className="space-y-1.5">
              <Label>
                Title{" "}
                <span className="text-muted-foreground">({locale})</span>
              </Label>
              <Input
                value={item.title[locale] ?? ""}
                onChange={(e) => {
                  const items = values.items.map((entry, i) =>
                    i === index
                      ? {
                          ...entry,
                          title: {
                            ...entry.title,
                            [locale]: e.target.value,
                          },
                        }
                      : entry
                  );
                  setSettings({
                    ...settings,
                    values: { ...values, items },
                  });
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Description{" "}
                <span className="text-muted-foreground">({locale})</span>
              </Label>
              <textarea
                rows={3}
                value={item.description[locale] ?? ""}
                onChange={(e) => {
                  const items = values.items.map((entry, i) =>
                    i === index
                      ? {
                          ...entry,
                          description: {
                            ...entry.description,
                            [locale]: e.target.value,
                          },
                        }
                      : entry
                  );
                  setSettings({
                    ...settings,
                    values: { ...values, items },
                  });
                }}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm"
              />
            </div>
            <ImageField
              label="Image"
              value={item.image?.src ?? ""}
              onChange={(url) => {
                const items = values.items.map((entry, i) =>
                  i === index
                    ? {
                        ...entry,
                        image: {
                          src: url,
                          alt: entry.image?.alt ?? {
                            en: "",
                            "pt-BR": "",
                            es: "",
                            "zh-CN": "",
                          },
                        },
                      }
                    : entry
                );
                setSettings({
                  ...settings,
                  values: { ...values, items },
                });
              }}
            />
            <div className="space-y-1.5">
              <Label>
                Image alt{" "}
                <span className="text-muted-foreground">({locale})</span>
              </Label>
              <Input
                value={item.image?.alt?.[locale] ?? ""}
                onChange={(e) => {
                  const items = values.items.map((entry, i) =>
                    i === index
                      ? {
                          ...entry,
                          image: {
                            src: entry.image?.src ?? "",
                            alt: {
                              ...(entry.image?.alt ?? {
                                en: "",
                                "pt-BR": "",
                                es: "",
                                "zh-CN": "",
                              }),
                              [locale]: e.target.value,
                            },
                          },
                        }
                      : entry
                  );
                  setSettings({
                    ...settings,
                    values: { ...values, items },
                  });
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Object position</Label>
              <Input
                value={item.objectPosition ?? "center center"}
                onChange={(e) => {
                  const items = values.items.map((entry, i) =>
                    i === index
                      ? { ...entry, objectPosition: e.target.value }
                      : entry
                  );
                  setSettings({
                    ...settings,
                    values: { ...values, items },
                  });
                }}
                placeholder="center 40%"
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
