import type { AboutPageSettings } from "@/lib/cms/repositories/about-page/types";
import { defaultSettings } from "@/lib/cms/repositories/about-page/defaults";
import {
  LEGACY_INSTITUTIONAL_IMAGE_SRC,
  LEGACY_MISSION_BODY,
  LEGACY_VALUES,
  LEGACY_VISION_BODY,
  sameLocalized,
} from "@/lib/cms/repositories/about-page/legacy-defaults";
import {
  fallbackValueImage,
  normalizeImpactStats,
  repairMissionVisionImages,
} from "@/lib/cms/repositories/about-page/fallbacks";

let cache: AboutPageSettings | null = null;
const CONTENT_REVISION = 25;
let cacheRevision = 0;

/** Ensure durable / legacy CMS docs have value images and Numbers stats. */
export function normalizeAboutPageSettings(
  settings: AboutPageSettings
): AboutPageSettings {
  const defaults = defaultSettings();

  const currentEvents = settings.timeline?.events ?? [];
  const years = new Set(currentEvents.map((event) => event.year));
  const isLegacyTimeline =
    currentEvents.length === 0 ||
    years.has("1998") ||
    years.has("2006") ||
    years.has("2016") ||
    years.has("2021") ||
    years.has("2025") ||
    !years.has("2005") ||
    !years.has("2013") ||
    !years.has("2023");

  const currentCalloutBody = settings.callout?.body?.en ?? "";
  const isLegacyCallout =
    !currentCalloutBody ||
    currentCalloutBody.includes("Most suppliers specialize") ||
    currentCalloutBody.includes("protect\nquality") ||
    !currentCalloutBody.includes("create long-term value throughout their operations");

  const currentHeroTitle = settings.hero?.title?.en ?? "";
  const isLegacyHero =
    !currentHeroTitle ||
    currentHeroTitle.includes("Oboya Horticulture supports growers") ||
    !settings.hero?.body?.en;

  const cultureItems = settings.culture?.items ?? [];
  const cultureFirstTitle = cultureItems[0]?.title?.en ?? "";
  const isLegacyCulture =
    cultureItems.length === 0 ||
    cultureFirstTitle === "Integrated Solutions" ||
    cultureItems.some((item) => item.id === "integrated" || item.id === "performance") ||
    !settings.culture?.title?.en;

  const valueItems = settings.values?.items ?? [];
  const isLegacyValues =
    !settings.values ||
    (valueItems.length === LEGACY_VALUES.length &&
      LEGACY_VALUES.every(
        (old, i) =>
          valueItems[i]?.id === old.id &&
          sameLocalized(valueItems[i]?.title, old.title) &&
          sameLocalized(valueItems[i]?.description, old.description)
      ));
  const isLegacyMission = sameLocalized(settings.mission?.body, LEGACY_MISSION_BODY);
  const isLegacyVision = sameLocalized(settings.vision?.body, LEGACY_VISION_BODY);

  return {
    ...settings,
    sections: {
      ...defaults.sections,
      ...settings.sections,
      impact: {
        enabled: settings.sections?.impact?.enabled ?? true,
      },
    },
    // The old default photo was replaced; keep any custom image set in the CMS.
    institutionalImage:
      !settings.institutionalImage?.src ||
      settings.institutionalImage.src === LEGACY_INSTITUTIONAL_IMAGE_SRC
        ? { ...settings.institutionalImage, ...defaults.institutionalImage }
        : settings.institutionalImage,
    hero: isLegacyHero
      ? defaults.hero
      : {
          ...defaults.hero,
          ...settings.hero,
          body: settings.hero?.body ?? defaults.hero.body,
        },
    timeline: {
      ...defaults.timeline,
      ...settings.timeline,
      prevLabel: settings.timeline?.prevLabel ?? defaults.timeline.prevLabel,
      nextLabel: settings.timeline?.nextLabel ?? defaults.timeline.nextLabel,
      events: isLegacyTimeline ? defaults.timeline.events : currentEvents,
    },
    callout: {
      ...defaults.callout,
      ...settings.callout,
      segments: isLegacyCallout
        ? defaults.callout.segments
        : settings.callout?.segments?.length
          ? settings.callout.segments
          : defaults.callout.segments,
      body: isLegacyCallout
        ? defaults.callout.body
        : (settings.callout?.body ?? defaults.callout.body),
    },
    culture: isLegacyCulture
      ? defaults.culture
      : {
          ...defaults.culture,
          ...settings.culture,
          title: settings.culture?.title ?? defaults.culture.title,
          eyebrow: settings.culture?.eyebrow ?? defaults.culture.eyebrow,
          items: cultureItems.length ? cultureItems : defaults.culture.items,
        },
    mission: repairMissionVisionImages(
      isLegacyMission
        ? { ...settings.mission, body: defaults.mission.body }
        : settings.mission,
      defaults.mission
    ),
    vision: repairMissionVisionImages(
      isLegacyVision
        ? { ...settings.vision, body: defaults.vision.body }
        : settings.vision,
      defaults.vision
    ),
    impact: {
      title: settings.impact?.title ?? defaults.impact.title,
      description: settings.impact?.description ?? defaults.impact.description,
      eyebrow: settings.impact?.eyebrow,
      stats: normalizeImpactStats(settings.impact?.stats ?? []),
    },
    values: {
      ...settings.values,
      items: (isLegacyValues ? defaults.values.items : valueItems).map((item) => {
        const fallback = fallbackValueImage(item.id);
        const src = item.image?.src ?? "";
        const needsImage =
          !src ||
          (item.id === "responsibility" &&
            src.includes("photo-1466692476867-a0881dfc0648"));

        if (!needsImage) {
          return {
            ...item,
            objectPosition: item.objectPosition ?? "center center",
          };
        }

        return {
          ...item,
          image: fallback.image,
          objectPosition: item.objectPosition ?? fallback.objectPosition,
        };
      }),
    },
  };
}

export function getAboutPageSettings(): AboutPageSettings {
  if (!cache || cacheRevision !== CONTENT_REVISION) {
    cache = defaultSettings();
    cacheRevision = CONTENT_REVISION;
  }
  return cache;
}

export function replaceAboutPageSettingsCache(settings: AboutPageSettings) {
  cache = normalizeAboutPageSettings(settings);
  cacheRevision = CONTENT_REVISION;
}

export function saveAboutPageSettings(
  settings: AboutPageSettings
): AboutPageSettings {
  const updated = normalizeAboutPageSettings({
    ...settings,
    updatedAt: new Date().toISOString(),
  });
  cache = updated;
  return updated;
}

export function resetAboutPageSettings(): AboutPageSettings {
  cache = defaultSettings();
  return cache;
}

