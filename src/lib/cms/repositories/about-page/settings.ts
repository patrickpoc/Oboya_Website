import type { AboutPageSettings } from "@/lib/cms/repositories/about-page/types";
import { defaultSettings } from "@/lib/cms/repositories/about-page/defaults";
import {
  LEGACY_CULTURE_IMAGE_SRC,
  LEGACY_INSTITUTIONAL_IMAGE_SRC,
  LEGACY_INSTITUTIONAL_IMAGE_SRC_JPG,
  LEGACY_MISSION_IMAGE_SRC,
  LEGACY_VISION_IMAGE_SRC,
  LEGACY_MISSION_BODY,
  LEGACY_VALUES,
  LEGACY_VISION_BODY,
  isLegacyClientsStat,
  sameLocalized,
} from "@/lib/cms/repositories/about-page/legacy-defaults";
import {
  fallbackValueImage,
  normalizeImpactStats,
  repairMissionVisionImages,
} from "@/lib/cms/repositories/about-page/fallbacks";

let cache: AboutPageSettings | null = null;
const CONTENT_REVISION = 29;

/** Previous single-line default of the impact title (English). */
const LEGACY_IMPACT_TITLE = "Oboya Horticulture in Numbers";

/** Previous single-paragraph default of the callout body (English). */
const LEGACY_CALLOUT_SINGLE_PARAGRAPH =
  "Many suppliers focus on individual categories. Oboya Horticulture takes a wider perspective. By offering solutions across multiple stages of the horticultural journey, we help customers improve efficiency, protect quality, optimize resources, and create long-term value throughout their operations.";
let cacheRevision = 0;

/** Replaces an image still at its old default src (src + alt) with the new default. */
function upgradeImage<T extends { src: string }>(
  image: T | undefined,
  legacySrc: string,
  next: T | undefined
): T | undefined {
  return image && next && image.src === legacySrc ? next : image;
}

function upgradeBlockImage(
  block: AboutPageSettings["mission"],
  legacySrc: string,
  fallback: AboutPageSettings["mission"]
): AboutPageSettings["mission"] {
  const [first, ...rest] = block.images;
  const next = upgradeImage(first, legacySrc, fallback.images[0]);
  return next === first ? block : { ...block, images: [next!, ...rest] };
}

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
    // Previous default was a single paragraph; it is now split in two.
    currentCalloutBody === LEGACY_CALLOUT_SINGLE_PARAGRAPH ||
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
      settings.institutionalImage.src === LEGACY_INSTITUTIONAL_IMAGE_SRC ||
      settings.institutionalImage.src === LEGACY_INSTITUTIONAL_IMAGE_SRC_JPG
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
          items: (cultureItems.length ? cultureItems : defaults.culture.items).map(
            (item) => {
              if (item.image !== LEGACY_CULTURE_IMAGE_SRC) return item;
              const next = defaults.culture.items.find((d) => d.id === item.id);
              return next
                ? { ...item, image: next.image, imageAlt: next.imageAlt }
                : { ...item, image: defaults.culture.items[0].image, imageAlt: defaults.culture.items[0].imageAlt };
            }
          ),
        },
    mission: upgradeBlockImage(
      repairMissionVisionImages(
        isLegacyMission
          ? { ...settings.mission, body: defaults.mission.body }
          : settings.mission,
        defaults.mission
      ),
      LEGACY_MISSION_IMAGE_SRC,
      defaults.mission
    ),
    vision: upgradeBlockImage(
      repairMissionVisionImages(
        isLegacyVision
          ? { ...settings.vision, body: defaults.vision.body }
          : settings.vision,
        defaults.vision
      ),
      LEGACY_VISION_IMAGE_SRC,
      defaults.vision
    ),
    impact: {
      // The old single-line default now breaks after "Oboya Horticulture".
      title:
        !settings.impact?.title || settings.impact.title.en === LEGACY_IMPACT_TITLE
          ? defaults.impact.title
          : settings.impact.title,
      description: settings.impact?.description ?? defaults.impact.description,
      eyebrow: settings.impact?.eyebrow,
      stats: normalizeImpactStats(
        (settings.impact?.stats ?? []).filter((stat) => !isLegacyClientsStat(stat))
      ),
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

