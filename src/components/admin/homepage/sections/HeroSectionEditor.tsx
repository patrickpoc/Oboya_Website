"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaField } from "@/components/admin/media/ImageField";
import { cn } from "@/lib/utils";
import {
  LocalizedInput,
  updateLocalizedField,
  type HomepageSectionEditorProps,
} from "../shared";

export function HeroSectionEditor({
  settings,
  setSettings,
  locale,
  persistSettings,
}: HomepageSectionEditorProps) {
  const t = useTranslations("admin.website.home");
  const tCommon = useTranslations("admin.common");
  const hero = settings.hero;
  const mediaType = hero.mediaType ?? "image";

  const setMediaType = (next: "image" | "video") => {
    setSettings({
      ...settings,
      hero: {
        ...hero,
        mediaType: next,
        backgroundVideo:
          next === "video"
            ? hero.backgroundVideo || "/assets/homepage/hero-hands-herbs.mp4"
            : hero.backgroundVideo,
        backgroundImage:
          next === "image"
            ? hero.backgroundImage || "/assets/homepage/hero-vineyard.jpg"
            : hero.backgroundImage,
      },
    });
  };

  const applyHeroVideo = async (url: string) => {
    const next: typeof settings = {
      ...settings,
      hero: {
        ...hero,
        mediaType: "video",
        backgroundVideo: url || null,
      },
    };
    setSettings(next);
    if (url && persistSettings) {
      await persistSettings(next);
    }
  };

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>{t("sections.hero.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("fields.mediaType")}</Label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "image", label: tCommon("image") },
                { id: "video", label: tCommon("video") },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setMediaType(option.id)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  mediaType === option.id
                    ? "border-oboya-blue-dark bg-oboya-blue-dark text-white"
                    : "border-border bg-white text-oboya-blue-dark hover:border-oboya-blue-dark/40"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {mediaType === "image" ? (
          <MediaField
            label={t("fields.backgroundImage")}
            value={hero.backgroundImage}
            allowedTypes={["image"]}
            onChange={(url) =>
              setSettings({
                ...settings,
                hero: { ...hero, backgroundImage: url },
              })
            }
          />
        ) : (
          <MediaField
            label={t("fields.backgroundVideo")}
            value={hero.backgroundVideo ?? ""}
            allowedTypes={["video"]}
            onChange={(url) => {
              void applyHeroVideo(url);
            }}
          />
        )}

        {mediaType === "video" ? (
          <p className="text-xs text-muted-foreground">
            {t("fields.videoUploadHint")}
          </p>
        ) : null}

        <LocalizedInput
          label={t("fields.eyebrow")}
          locale={locale}
          value={hero.eyebrow[locale]}
          onChange={(l, v) =>
            setSettings({
              ...settings,
              hero: { ...hero, eyebrow: updateLocalizedField(hero.eyebrow, l, v) },
            })
          }
        />
        <LocalizedInput
          label={t("fields.headline")}
          locale={locale}
          value={hero.title[locale]}
          onChange={(l, v) =>
            setSettings({
              ...settings,
              hero: { ...hero, title: updateLocalizedField(hero.title, l, v) },
            })
          }
        />
        <LocalizedInput
          label={t("fields.subheadline")}
          locale={locale}
          value={hero.description[locale]}
          onChange={(l, v) =>
            setSettings({
              ...settings,
              hero: {
                ...hero,
                description: updateLocalizedField(hero.description, l, v),
              },
            })
          }
          multiline
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">{t("fields.primaryCta")}</p>
            <LocalizedInput
              label={tCommon("label")}
              locale={locale}
              value={hero.ctaPrimary.label[locale]}
              onChange={(l, v) =>
                setSettings({
                  ...settings,
                  hero: {
                    ...hero,
                    ctaPrimary: {
                      ...hero.ctaPrimary,
                      label: updateLocalizedField(hero.ctaPrimary.label, l, v),
                    },
                  },
                })
              }
            />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{tCommon("link")}</Label>
              <Input
                value={hero.ctaPrimary.href}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    hero: {
                      ...hero,
                      ctaPrimary: { ...hero.ctaPrimary, href: e.target.value },
                    },
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">{t("fields.secondaryCta")}</p>
            <LocalizedInput
              label={tCommon("label")}
              locale={locale}
              value={hero.ctaSecondary.label[locale]}
              onChange={(l, v) =>
                setSettings({
                  ...settings,
                  hero: {
                    ...hero,
                    ctaSecondary: {
                      ...hero.ctaSecondary,
                      label: updateLocalizedField(hero.ctaSecondary.label, l, v),
                    },
                  },
                })
              }
            />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{tCommon("link")}</Label>
              <Input
                value={hero.ctaSecondary.href}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    hero: {
                      ...hero,
                      ctaSecondary: {
                        ...hero.ctaSecondary,
                        href: e.target.value,
                      },
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
