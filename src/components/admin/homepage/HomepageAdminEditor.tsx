"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { LocaleFieldTabs } from "@/components/admin/forms/LocaleFieldTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Can } from "@/components/admin/permissions/Can";
import {
  getHomepageSettings,
  saveHomepageSettings,
  type HomepageCapability,
  type HomepageProductCard,
  type HomepageSectionId,
  type HomepageSettings,
} from "@/lib/cms/repositories/homepage-repository";
import type { CmsLocale, LocalizedString } from "@/lib/cms/types";

const SECTION_LABELS: Record<HomepageSectionId, string> = {
  hero: "Hero",
  companyOverview: "Statistics & Mission",
  capabilities: "Capabilities",
  globalPresence: "Global Presence (title only — map is fixed)",
  testimonials: "Testimonials",
  featuredProducts: "Featured Products",
  latestNews: "Latest News",
  partners: "Partners & Clients",
};

function LocalizedInput({
  label,
  value,
  locale,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  locale: CmsLocale;
  onChange: (locale: CmsLocale, value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(locale, e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-input px-3 py-2 text-sm"
        />
      ) : (
        <Input value={value} onChange={(e) => onChange(locale, e.target.value)} />
      )}
    </div>
  );
}

export function HomepageAdminEditor() {
  const [settings, setSettings] = useState<HomepageSettings>(getHomepageSettings());
  const [locale, setLocale] = useState<CmsLocale>("en");

  const updateLocalized = (
    path: keyof HomepageSettings,
    field: string,
    loc: CmsLocale,
    value: string
  ) => {
    setSettings((prev) => {
      const section = prev[path] as Record<string, unknown>;
      const localized = section[field] as Record<CmsLocale, string>;
      return {
        ...prev,
        [path]: {
          ...section,
          [field]: { ...localized, [loc]: value },
        },
      };
    });
  };

  const handleSave = async () => {
    saveHomepageSettings(settings);
    try {
      await fetch("/api/cms/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    } catch {
      // in-memory fallback
    }
    toast.success("Homepage saved");
  };

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
    <Can
      module="website"
      action="edit"
      fallback={<p className="text-sm text-muted-foreground">Access denied.</p>}
    >
      <div>
        <AdminPageHeader
          title="Homepage"
          description="Edit homepage sections. The interactive map component is fixed and cannot be changed here."
          actions={
            <Button
              onClick={handleSave}
              className="rounded-full bg-oboya-green hover:bg-oboya-green/90"
            >
              Save homepage
            </Button>
          }
        />

        <Card className="mb-6 max-w-3xl">
          <CardHeader>
            <CardTitle>Section visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.keys(SECTION_LABELS) as HomepageSectionId[]).map((id) => (
              <div key={id} className="flex items-center justify-between gap-4">
                <Label htmlFor={`section-${id}`}>{SECTION_LABELS[id]}</Label>
                <Switch
                  id={`section-${id}`}
                  checked={settings.sections[id].enabled}
                  onCheckedChange={() => toggleSection(id)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Tabs defaultValue="hero" className="max-w-4xl">
          <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
            {(Object.keys(SECTION_LABELS) as HomepageSectionId[]).map((id) => (
              <TabsTrigger key={id} value={id} className="text-xs sm:text-sm">
                {SECTION_LABELS[id]}
              </TabsTrigger>
            ))}
          </TabsList>

          <LocaleFieldTabs value={locale} onChange={setLocale}>
            {(loc) => (
              <>
                <TabsContent value="hero">
                  <Card>
                    <CardHeader>
                      <CardTitle>Hero</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>Background image URL</Label>
                        <Input
                          value={settings.hero.backgroundImage}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              hero: { ...settings.hero, backgroundImage: e.target.value },
                            })
                          }
                        />
                      </div>
                      <LocalizedInput
                        label="Eyebrow"
                        locale={loc}
                        value={settings.hero.eyebrow[loc]}
                        onChange={(l, v) => updateLocalized("hero", "eyebrow", l, v)}
                      />
                      <LocalizedInput
                        label="Headline"
                        locale={loc}
                        value={settings.hero.title[loc]}
                        onChange={(l, v) => updateLocalized("hero", "title", l, v)}
                      />
                      <LocalizedInput
                        label="Subheadline"
                        locale={loc}
                        value={settings.hero.description[loc]}
                        onChange={(l, v) => updateLocalized("hero", "description", l, v)}
                        multiline
                      />
                      <p className="text-xs text-muted-foreground">
                        Navigation pills: edit labels and links below.
                      </p>
                      {settings.hero.pills.map((pill, index) => (
                        <div key={pill.id} className="rounded-lg border p-4 space-y-3">
                          <LocalizedInput
                            label={`Pill ${index + 1} label`}
                            locale={loc}
                            value={pill.label[loc]}
                            onChange={(_, v) => {
                              const pills = [...settings.hero.pills];
                              pills[index] = {
                                ...pill,
                                label: { ...pill.label, [loc]: v },
                              };
                              setSettings({ ...settings, hero: { ...settings.hero, pills } });
                            }}
                          />
                          <LocalizedInput
                            label="Sublabel"
                            locale={loc}
                            value={pill.sublabel[loc]}
                            onChange={(_, v) => {
                              const pills = [...settings.hero.pills];
                              pills[index] = {
                                ...pill,
                                sublabel: { ...pill.sublabel, [loc]: v },
                              };
                              setSettings({ ...settings, hero: { ...settings.hero, pills } });
                            }}
                          />
                          <div className="space-y-1.5">
                            <Label>Link</Label>
                            <Input
                              value={pill.href}
                              onChange={(e) => {
                                const pills = [...settings.hero.pills];
                                pills[index] = { ...pill, href: e.target.value };
                                setSettings({ ...settings, hero: { ...settings.hero, pills } });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="companyOverview">
                  <Card>
                    <CardHeader>
                      <CardTitle>Statistics & Mission</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <LocalizedInput
                        label="Headline (green part)"
                        locale={loc}
                        value={settings.companyOverview.headlineGreen[loc]}
                        onChange={(l, v) =>
                          updateLocalized("companyOverview", "headlineGreen", l, v)
                        }
                      />
                      <LocalizedInput
                        label="Headline (white part)"
                        locale={loc}
                        value={settings.companyOverview.headlineWhite[loc]}
                        onChange={(l, v) =>
                          updateLocalized("companyOverview", "headlineWhite", l, v)
                        }
                      />
                      <div className="space-y-1.5">
                        <Label>Image URL</Label>
                        <Input
                          value={settings.companyOverview.image}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              companyOverview: {
                                ...settings.companyOverview,
                                image: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      {settings.companyOverview.stats.map((stat, index) => (
                        <div key={stat.id} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
                          <div className="space-y-1.5">
                            <Label>Value</Label>
                            <Input
                              type="number"
                              value={stat.value}
                              onChange={(e) => {
                                const stats = [...settings.companyOverview.stats];
                                stats[index] = { ...stat, value: Number(e.target.value) };
                                setSettings({
                                  ...settings,
                                  companyOverview: { ...settings.companyOverview, stats },
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Suffix</Label>
                            <Input
                              value={stat.suffix}
                              onChange={(e) => {
                                const stats = [...settings.companyOverview.stats];
                                stats[index] = { ...stat, suffix: e.target.value };
                                setSettings({
                                  ...settings,
                                  companyOverview: { ...settings.companyOverview, stats },
                                });
                              }}
                            />
                          </div>
                          <LocalizedInput
                            label="Label"
                            locale={loc}
                            value={stat.label[loc]}
                            onChange={(_, v) => {
                              const stats = [...settings.companyOverview.stats];
                              stats[index] = {
                                ...stat,
                                label: { ...stat.label, [loc]: v },
                              };
                              setSettings({
                                ...settings,
                                companyOverview: { ...settings.companyOverview, stats },
                              });
                            }}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="capabilities">
                  <SectionItemsEditor
                    locale={loc}
                    settings={settings}
                    setSettings={setSettings}
                    sectionKey="capabilities"
                  />
                </TabsContent>

                <TabsContent value="globalPresence">
                  <Card>
                    <CardHeader>
                      <CardTitle>Global Presence</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Only the section title is editable. The interactive map is locked to the
                        final production version.
                      </p>
                      <LocalizedInput
                        label="Section title"
                        locale={loc}
                        value={settings.globalPresence.title[loc]}
                        onChange={(l, v) =>
                          updateLocalized("globalPresence", "title", l, v)
                        }
                        multiline
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="testimonials">
                  <Card>
                    <CardHeader>
                      <CardTitle>Testimonials</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <LocalizedInput
                        label="Eyebrow"
                        locale={loc}
                        value={settings.testimonials.eyebrow[loc]}
                        onChange={(l, v) => updateLocalized("testimonials", "eyebrow", l, v)}
                      />
                      {settings.testimonials.items.map((item, index) => (
                        <div key={item.id} className="space-y-3 rounded-lg border p-4">
                          <LocalizedInput
                            label="Quote"
                            locale={loc}
                            value={item.quote[loc]}
                            onChange={(_, v) => {
                              const items = [...settings.testimonials.items];
                              items[index] = {
                                ...item,
                                quote: { ...item.quote, [loc]: v },
                              };
                              setSettings({
                                ...settings,
                                testimonials: { ...settings.testimonials, items },
                              });
                            }}
                            multiline
                          />
                          <LocalizedInput
                            label="Author"
                            locale={loc}
                            value={item.author[loc]}
                            onChange={(_, v) => {
                              const items = [...settings.testimonials.items];
                              items[index] = {
                                ...item,
                                author: { ...item.author, [loc]: v },
                              };
                              setSettings({
                                ...settings,
                                testimonials: { ...settings.testimonials, items },
                              });
                            }}
                          />
                          <LocalizedInput
                            label="Role"
                            locale={loc}
                            value={item.role[loc]}
                            onChange={(_, v) => {
                              const items = [...settings.testimonials.items];
                              items[index] = {
                                ...item,
                                role: { ...item.role, [loc]: v },
                              };
                              setSettings({
                                ...settings,
                                testimonials: { ...settings.testimonials, items },
                              });
                            }}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="featuredProducts">
                  <SectionItemsEditor
                    locale={loc}
                    settings={settings}
                    setSettings={setSettings}
                    sectionKey="featuredProducts"
                  />
                </TabsContent>

                <TabsContent value="latestNews">
                  <Card>
                    <CardHeader>
                      <CardTitle>Latest News</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <LocalizedInput
                        label="Eyebrow"
                        locale={loc}
                        value={settings.latestNews.eyebrow[loc]}
                        onChange={(l, v) => updateLocalized("latestNews", "eyebrow", l, v)}
                      />
                      <LocalizedInput
                        label="Headline"
                        locale={loc}
                        value={settings.latestNews.headline[loc]}
                        onChange={(l, v) => updateLocalized("latestNews", "headline", l, v)}
                        multiline
                      />
                      <div className="space-y-1.5">
                        <Label>Number of posts on homepage</Label>
                        <Input
                          type="number"
                          min={1}
                          max={4}
                          value={settings.latestNews.postCount}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              latestNews: {
                                ...settings.latestNews,
                                postCount: Number(e.target.value) || 2,
                              },
                            })
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Articles are managed under Blog → Posts.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="partners">
                  <Card>
                    <CardHeader>
                      <CardTitle>Partners & Clients</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <LocalizedInput
                        label="Section title"
                        locale={loc}
                        value={settings.partners.title[loc]}
                        onChange={(l, v) => updateLocalized("partners", "title", l, v)}
                      />
                      {settings.partners.logos.map((logo, index) => (
                        <div key={logo.id} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label>Name</Label>
                            <Input
                              value={logo.name}
                              onChange={(e) => {
                                const logos = [...settings.partners.logos];
                                logos[index] = { ...logo, name: e.target.value };
                                setSettings({
                                  ...settings,
                                  partners: { ...settings.partners, logos },
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Logo image URL (optional)</Label>
                            <Input
                              value={logo.image}
                              onChange={(e) => {
                                const logos = [...settings.partners.logos];
                                logos[index] = { ...logo, image: e.target.value };
                                setSettings({
                                  ...settings,
                                  partners: { ...settings.partners, logos },
                                });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </LocaleFieldTabs>
        </Tabs>
      </div>
    </Can>
  );
}

const emptyLocalized = (): LocalizedString => ({
  en: "",
  "pt-BR": "",
  es: "",
  "zh-CN": "",
});

function updateLocalizedField(
  value: LocalizedString,
  locale: CmsLocale,
  next: string
): LocalizedString {
  return { ...value, [locale]: next };
}

function SectionItemsEditor({
  locale,
  settings,
  setSettings,
  sectionKey,
}: {
  locale: CmsLocale;
  settings: HomepageSettings;
  setSettings: React.Dispatch<React.SetStateAction<HomepageSettings>>;
  sectionKey: "capabilities" | "featuredProducts";
}) {
  if (sectionKey === "featuredProducts") {
    const section = settings.featuredProducts;

    const patchFeatured = (
      patch: Partial<HomepageSettings["featuredProducts"]> & {
        items?: HomepageProductCard[];
      }
    ) =>
      setSettings((prev) => ({
        ...prev,
        featuredProducts: { ...prev.featuredProducts, ...patch },
      }));

    return (
      <Card>
        <CardHeader>
          <CardTitle>Featured Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocalizedInput
            label="Eyebrow"
            locale={locale}
            value={section.eyebrow[locale]}
            onChange={(l, v) =>
              patchFeatured({ eyebrow: updateLocalizedField(section.eyebrow, l, v) })
            }
          />
          <LocalizedInput
            label="Title"
            locale={locale}
            value={section.title[locale]}
            onChange={(l, v) =>
              patchFeatured({ title: updateLocalizedField(section.title, l, v) })
            }
            multiline
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <LocalizedInput
              label="CTA label"
              locale={locale}
              value={section.ctaLabel[locale]}
              onChange={(l, v) =>
                patchFeatured({ ctaLabel: updateLocalizedField(section.ctaLabel, l, v) })
              }
            />
            <div className="space-y-1.5">
              <Label>CTA link</Label>
              <Input
                value={section.ctaHref}
                onChange={(e) => patchFeatured({ ctaHref: e.target.value })}
              />
            </div>
          </div>

          {section.items.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-lg border p-4">
              <div className="space-y-1.5">
                <Label>Shop product ID</Label>
                <Input
                  value={item.productId}
                  onChange={(e) => {
                    const items = section.items.map((it, i) =>
                      i === index ? { ...it, productId: e.target.value } : it
                    );
                    patchFeatured({ items });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Must match an id from the shop catalog (e.g. retail-clamshell).
                </p>
              </div>
              <LocalizedInput
                label="Category label (optional override)"
                locale={locale}
                value={item.categoryLabel?.[locale] ?? ""}
                onChange={(l, v) => {
                  const items = section.items.map((it, i) =>
                    i === index
                      ? {
                          ...it,
                          categoryLabel: updateLocalizedField(
                            it.categoryLabel ?? emptyLocalized(),
                            l,
                            v
                          ),
                        }
                      : it
                  );
                  patchFeatured({ items });
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const section = settings.capabilities;

  const patchCapabilities = (
    patch: Partial<HomepageSettings["capabilities"]> & {
      items?: HomepageCapability[];
    }
  ) =>
    setSettings((prev) => ({
      ...prev,
      capabilities: { ...prev.capabilities, ...patch },
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Capabilities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LocalizedInput
          label="Eyebrow"
          locale={locale}
          value={section.eyebrow[locale]}
          onChange={(l, v) =>
            patchCapabilities({ eyebrow: updateLocalizedField(section.eyebrow, l, v) })
          }
        />
        <LocalizedInput
          label="Title"
          locale={locale}
          value={section.title[locale]}
          onChange={(l, v) =>
            patchCapabilities({ title: updateLocalizedField(section.title, l, v) })
          }
          multiline
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <LocalizedInput
            label="CTA label"
            locale={locale}
            value={section.ctaLabel[locale]}
            onChange={(l, v) =>
              patchCapabilities({ ctaLabel: updateLocalizedField(section.ctaLabel, l, v) })
            }
          />
          <div className="space-y-1.5">
            <Label>CTA link</Label>
            <Input
              value={section.ctaHref}
              onChange={(e) => patchCapabilities({ ctaHref: e.target.value })}
            />
          </div>
        </div>

        {section.items.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-lg border p-4">
            <LocalizedInput
              label="Title"
              locale={locale}
              value={item.title[locale]}
              onChange={(l, v) => {
                const items = section.items.map((it, i) =>
                  i === index
                    ? { ...it, title: updateLocalizedField(it.title, l, v) }
                    : it
                );
                patchCapabilities({ items });
              }}
            />
            <LocalizedInput
              label="Description"
              locale={locale}
              value={item.description[locale]}
              onChange={(l, v) => {
                const items = section.items.map((it, i) =>
                  i === index
                    ? {
                        ...it,
                        description: updateLocalizedField(it.description, l, v),
                      }
                    : it
                );
                patchCapabilities({ items });
              }}
              multiline
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Image URL</Label>
                <Input
                  value={item.image}
                  onChange={(e) => {
                    const items = section.items.map((it, i) =>
                      i === index ? { ...it, image: e.target.value } : it
                    );
                    patchCapabilities({ items });
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Link</Label>
                <Input
                  value={item.href}
                  onChange={(e) => {
                    const items = section.items.map((it, i) =>
                      i === index ? { ...it, href: e.target.value } : it
                    );
                    patchCapabilities({ items });
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
