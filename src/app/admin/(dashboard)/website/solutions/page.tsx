"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { LocaleFieldTabs } from "@/components/admin/forms/LocaleFieldTabs";
import { ShopFilterTargetFields } from "@/components/admin/solutions/ShopFilterTargetFields";
import { Can } from "@/components/admin/permissions/Can";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  SolutionsPageBanner,
  SolutionsPageCrop,
  SolutionsPageSettings,
} from "@/lib/cms/repositories/solutions-page-repository";
import type { CmsLocale, LocalizedString } from "@/lib/cms/types";
import type {
  ShopBrand,
  ShopCategory,
  ShopFilterOptions,
} from "@/lib/shop/types";
import {
  normalizeBrands,
  normalizeCategories,
  normalizeFilterOptions,
} from "@/lib/shop/filter-groups";
import { updateShopCatalog } from "@/lib/shop/catalog";
import { buildShopHrefForSolution } from "@/lib/solutions/solutions-shop-linking";

function emptyLocalized(en = ""): LocalizedString {
  return { en, "pt-BR": "", es: "", "zh-CN": "" };
}

function setLocalized(
  current: LocalizedString,
  locale: CmsLocale,
  value: string
): LocalizedString {
  return { ...current, [locale]: value };
}

export default function SolutionsPageAdmin() {
  const [settings, setSettings] = useState<SolutionsPageSettings | null>(null);
  const [locale, setLocale] = useState<CmsLocale>("en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [brands, setBrands] = useState<ShopBrand[]>([]);
  const [filterOptions, setFilterOptions] = useState<ShopFilterOptions>({
    applications: [],
    cultures: [],
    certifications: [],
    countriesOfOrigin: [],
  });

  useEffect(() => {
    void (async () => {
      try {
        const [solutionsRes, filtersRes] = await Promise.all([
          fetch("/api/cms/solutions", { cache: "no-store" }),
          fetch("/api/cms/marketplace/filters", { cache: "no-store" }),
        ]);
        if (!solutionsRes.ok) throw new Error("Failed to load solutions");
        setSettings(await solutionsRes.json());
        if (filtersRes.ok) {
          const filters = (await filtersRes.json()) as {
            categories: ShopCategory[];
            brands: ShopBrand[];
            filterOptions: ShopFilterOptions;
          };
          const categoriesNext = normalizeCategories(filters.categories ?? []);
          const brandsNext = normalizeBrands(filters.brands ?? []);
          const optionsNext = normalizeFilterOptions(filters.filterOptions);
          setCategories(categoriesNext);
          setBrands(brandsNext);
          setFilterOptions(optionsNext);
          updateShopCatalog({
            categories: categoriesNext,
            brands: brandsNext,
            filterOptions: optionsNext,
          });
        }
      } catch {
        toast.error("Could not load solutions page settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/cms/solutions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = (await res.json()) as SolutionsPageSettings & {
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSettings(data);
      toast.success("Solutions page saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save solutions page"
      );
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const updateCrop = (index: number, patch: Partial<SolutionsPageCrop>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        crops: prev.crops.map((crop, i) =>
          i === index ? { ...crop, ...patch } : crop
        ),
      };
    });
  };

  const updateBanner = (index: number, patch: Partial<SolutionsPageBanner>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        banners: prev.banners.map((banner, i) =>
          i === index ? { ...banner, ...patch } : banner
        ),
      };
    });
  };

  const addBanner = () => {
    setSettings((prev) => {
      if (!prev) return prev;
      const id = `banner-${Date.now()}`;
      return {
        ...prev,
        banners: [
          ...prev.banners,
          {
            id,
            image: "/assets/homepage/capabilities-value-chain.jpg",
            title: emptyLocalized("New solution banner"),
            tags: [emptyLocalized("Tag")],
            shop: {},
          },
        ],
      };
    });
  };

  const removeBanner = (index: number) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        banners: prev.banners.filter((_, i) => i !== index),
      };
    });
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
          title="Solutions"
          description="Edit the Solutions page hero, crop filters, stage banners, and the shop filters each banner applies when clicked."
          actions={
            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
            >
              {saving ? "Saving…" : "Save Solutions"}
            </Button>
          }
        />

        <LocaleFieldTabs value={locale} onChange={setLocale}>
          {() => (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Headline</Label>
                <Input
                  value={settings.hero.headline[locale] ?? ""}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      hero: {
                        ...settings.hero,
                        headline: setLocalized(
                          settings.hero.headline,
                          locale,
                          event.target.value
                        ),
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Body</Label>
                <Textarea
                  rows={4}
                  value={settings.hero.body[locale] ?? ""}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      hero: {
                        ...settings.hero,
                        body: setLocalized(
                          settings.hero.body,
                          locale,
                          event.target.value
                        ),
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Crop filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.crops.map((crop, index) => (
                <div
                  key={crop.id}
                  className="space-y-3 rounded-xl border border-border/60 p-4"
                >
                  <p className="text-sm font-semibold text-oboya-blue-dark">
                    {crop.id}
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Chip label</Label>
                      <Input
                        value={crop.label[locale] ?? ""}
                        onChange={(event) =>
                          updateCrop(index, {
                            label: setLocalized(
                              crop.label,
                              locale,
                              event.target.value
                            ),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Sector title</Label>
                      <Input
                        value={crop.sectorTitle[locale] ?? ""}
                        onChange={(event) =>
                          updateCrop(index, {
                            sectorTitle: setLocalized(
                              crop.sectorTitle,
                              locale,
                              event.target.value
                            ),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      rows={3}
                      value={crop.description[locale] ?? ""}
                      onChange={(event) =>
                        updateCrop(index, {
                          description: setLocalized(
                            crop.description,
                            locale,
                            event.target.value
                          ),
                        })
                      }
                    />
                  </div>
                  <ShopFilterTargetFields
                    value={crop.shop}
                    onChange={(shop) => updateCrop(index, { shop })}
                    filterOptions={filterOptions}
                    categories={categories}
                    brands={brands}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>Stage banners</span>
                <Button variant="outline" size="sm" onClick={addBanner}>
                  <Plus className="mr-1 size-3.5" /> Add banner
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.banners.map((banner, index) => {
                const previewHref = buildShopHrefForSolution(banner.shop);
                return (
                  <div
                    key={banner.id}
                    className="space-y-3 rounded-xl border border-border/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label>Title</Label>
                            <Input
                              value={banner.title[locale] ?? ""}
                              onChange={(event) =>
                                updateBanner(index, {
                                  title: setLocalized(
                                    banner.title,
                                    locale,
                                    event.target.value
                                  ),
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Image URL</Label>
                            <Input
                              value={banner.image}
                              onChange={(event) =>
                                updateBanner(index, {
                                  image: event.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Tags (one per line)</Label>
                          <Textarea
                            rows={3}
                            value={banner.tags
                              .map((tag) => tag[locale] || tag.en || "")
                              .join("\n")}
                            onChange={(event) => {
                              const lines = event.target.value
                                .split("\n")
                                .map((line) => line.trim())
                                .filter(Boolean);
                              updateBanner(index, {
                                tags: lines.map((line, tagIndex) =>
                                  setLocalized(
                                    banner.tags[tagIndex] ?? emptyLocalized(),
                                    locale,
                                    line
                                  )
                                ),
                              });
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Preview (banner only):{" "}
                          <code className="rounded bg-muted px-1">{previewHref}</code>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        aria-label="Remove banner"
                        onClick={() => removeBanner(index)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <ShopFilterTargetFields
                      value={banner.shop}
                      onChange={(shop) => updateBanner(index, { shop })}
                      filterOptions={filterOptions}
                      categories={categories}
                      brands={brands}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CTA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  value={settings.cta.title[locale] ?? ""}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      cta: {
                        ...settings.cta,
                        title: setLocalized(
                          settings.cta.title,
                          locale,
                          event.target.value
                        ),
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={settings.cta.description[locale] ?? ""}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      cta: {
                        ...settings.cta,
                        description: setLocalized(
                          settings.cta.description,
                          locale,
                          event.target.value
                        ),
                      },
                    })
                  }
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Button label</Label>
                  <Input
                    value={settings.cta.buttonLabel[locale] ?? ""}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        cta: {
                          ...settings.cta,
                          buttonLabel: setLocalized(
                            settings.cta.buttonLabel,
                            locale,
                            event.target.value
                          ),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Button href</Label>
                  <Input
                    value={settings.cta.href}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        cta: { ...settings.cta, href: event.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
          )}
        </LocaleFieldTabs>
      </div>
    </Can>
  );
}
