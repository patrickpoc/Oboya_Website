import type { LocalizedString } from "@/lib/cms/types";
import type {
  ShopFilterTarget,
  SolutionsCropFilterId,
  SolutionStageCardId,
} from "@/lib/solutions/types";

function L(en: string): LocalizedString {
  return { en, "pt-BR": en, es: en, "zh-CN": en };
}

export interface SolutionsPageCrop {
  id: SolutionsCropFilterId;
  label: LocalizedString;
  /** Description shown when this crop is active (ignored for `all`). */
  description: LocalizedString;
  /** Sector title used in “Solutions for {sector}”. */
  sectorTitle: LocalizedString;
  shop: ShopFilterTarget;
}

export interface SolutionsPageBanner {
  id: SolutionStageCardId | string;
  image: string;
  title: LocalizedString;
  /** Comma-free tag labels shown under the title. */
  tags: LocalizedString[];
  shop: ShopFilterTarget;
}

export interface SolutionsPageSettings {
  hero: {
    headline: LocalizedString;
    body: LocalizedString;
  };
  crops: SolutionsPageCrop[];
  banners: SolutionsPageBanner[];
  cta: {
    title: LocalizedString;
    description: LocalizedString;
    buttonLabel: LocalizedString;
    href: string;
  };
  updatedAt: string;
}

function defaultCrops(): SolutionsPageCrop[] {
  return [
    {
      id: "all",
      label: L("All Crops"),
      description: L(
        "Supporting flower growers, exporters, distributors, and retailers from propagation to point of sale."
      ),
      sectorTitle: L("every crop"),
      shop: {},
    },
    {
      id: "flowers",
      label: L("Flowers"),
      description: L(
        "Supporting flower growers, exporters, distributors, and retailers from propagation to point of sale."
      ),
      sectorTitle: L("Floriculture"),
      shop: { cultures: ["flowers"] },
    },
    {
      id: "vegetables",
      label: L("Vegetables & Herbs"),
      description: L(
        "Supporting efficient production, handling, packaging, and commercialization for vegetable and herb operations."
      ),
      sectorTitle: L("Vegetables & Herbs"),
      shop: { cultures: ["vegetables"] },
    },
    {
      id: "fruits",
      label: L("Fruits"),
      description: L(
        "Optimizing cultivation, handling, packaging, and distribution across the fruit supply chain."
      ),
      sectorTitle: L("Fruits"),
      shop: { cultures: ["fruits"] },
    },
  ];
}

function defaultBanners(): SolutionsPageBanner[] {
  return [
    {
      id: "propagation",
      image: "/assets/solutions/stage-propagation.jpg",
      title: L("Propagation Solutions"),
      tags: [L("Seedling trays"), L("Substrates")],
      shop: { categoryId: "propagation" },
    },
    {
      id: "growing",
      image: "/assets/solutions/stage-growing.jpg",
      title: L("Growing Solutions"),
      tags: [L("Seedling trays"), L("Substrates"), L("Pots"), L("Irrigation")],
      shop: { categoryId: "growing" },
    },
    {
      id: "harvest",
      image: "/assets/solutions/stage-harvest.jpg",
      title: L("Harvest Solutions"),
      tags: [L("Crates"), L("Transport trays"), L("Harvest carts")],
      shop: { categoryId: "harvest" },
    },
    {
      id: "postharvest",
      image: "/assets/solutions/stage-postharvest.jpg",
      title: L("Postharvest Solutions"),
      tags: [L("Packaging"), L("Crates")],
      shop: { categoryId: "post-harvest" },
    },
    {
      id: "transport-logistics",
      image: "/assets/solutions/stage-transport.png",
      title: L("Transport & Logistics"),
      tags: [L("Logistics trolleys"), L("Display systems")],
      shop: { categoryId: "transport-and-logistics" },
    },
    {
      id: "retail",
      image: "/assets/solutions/stage-retail.jpg",
      title: L("Retail"),
      tags: [L("Logistics trolleys"), L("Display systems")],
      shop: { categoryId: "retail" },
    },
    {
      id: "automation",
      image: "/assets/solutions/stage-automation.jpg",
      title: L("Automation & Machinery"),
      tags: [L("Automation systems"), L("Greenhouse tech")],
      shop: { categoryId: "automation-and-machinery" },
    },
  ];
}

export function createDefaultSolutionsPageSettings(): SolutionsPageSettings {
  return {
    hero: {
      headline: L("Solutions for Every Stage of Horticulture"),
      body: L(
        "Different crops, different markets, different operational realities. Every business faces unique challenges, but the objective remains the same: improve performance, protect quality, and support sustainable growth. Explore solutions tailored to your sector and designed to support every stage of your horticultural operation."
      ),
    },
    crops: defaultCrops(),
    banners: defaultBanners(),
    cta: {
      title: L("Ready to find the right solution?"),
      description: L(
        "Browse products in the Shop or contact our team for tailored recommendations."
      ),
      buttonLabel: L("Go to Shop"),
      href: "/shop",
    },
    updatedAt: new Date().toISOString(),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

/**
 * Stage banners used to target `applications`, but the live shop catalogs
 * stages as categories (Propagation, Growing, …). Map legacy keys.
 */
const STAGE_APPLICATION_TO_CATEGORY: Record<string, string> = {
  propagation: "propagation",
  growing: "growing",
  harvest: "harvest",
  postharvest: "post-harvest",
  "post-harvest": "post-harvest",
  logistics: "transport-and-logistics",
  "transport-logistics": "transport-and-logistics",
  "transport-and-logistics": "transport-and-logistics",
  retail: "retail",
  automation: "automation-and-machinery",
  "automation-and-machinery": "automation-and-machinery",
};

function migrateLegacyStageShop(
  shop: ShopFilterTarget,
  bannerId?: string
): ShopFilterTarget {
  if (shop.categoryId) return shop;

  const fromApps = shop.applications?.[0];
  const key = fromApps || bannerId;
  if (!key) return shop;

  const categoryId = STAGE_APPLICATION_TO_CATEGORY[key];
  if (!categoryId) return shop;

  const next: ShopFilterTarget = { ...shop, categoryId };
  // Drop the sole stage application that was only a stand-in for category.
  if (
    next.applications?.length === 1 &&
    STAGE_APPLICATION_TO_CATEGORY[next.applications[0]!]
  ) {
    delete next.applications;
  }
  return next;
}

function normalizeShop(
  value: unknown,
  options?: { bannerId?: string }
): ShopFilterTarget {
  if (!isObject(value)) {
    return migrateLegacyStageShop({}, options?.bannerId);
  }
  const shop: ShopFilterTarget = {
    categoryId:
      typeof value.categoryId === "string" || value.categoryId === null
        ? (value.categoryId as string | null)
        : undefined,
    subcategoryIds: Array.isArray(value.subcategoryIds)
      ? value.subcategoryIds.filter((id): id is string => typeof id === "string")
      : undefined,
    brandIds: Array.isArray(value.brandIds)
      ? value.brandIds.filter((id): id is string => typeof id === "string")
      : undefined,
    applications: Array.isArray(value.applications)
      ? value.applications.filter((id): id is string => typeof id === "string")
      : undefined,
    cultures: Array.isArray(value.cultures)
      ? value.cultures.filter((id): id is string => typeof id === "string")
      : undefined,
    certifications: Array.isArray(value.certifications)
      ? value.certifications.filter((id): id is string => typeof id === "string")
      : undefined,
    countriesOfOrigin: Array.isArray(value.countriesOfOrigin)
      ? value.countriesOfOrigin.filter((id): id is string => typeof id === "string")
      : undefined,
    q: typeof value.q === "string" ? value.q : undefined,
  };
  return migrateLegacyStageShop(shop, options?.bannerId);
}

function normalizeLocalized(
  value: unknown,
  fallback: LocalizedString
): LocalizedString {
  if (!isObject(value)) return { ...fallback };
  return {
    en: typeof value.en === "string" && value.en.trim() ? value.en : fallback.en,
    "pt-BR":
      typeof value["pt-BR"] === "string" ? value["pt-BR"] : fallback["pt-BR"],
    es: typeof value.es === "string" ? value.es : fallback.es,
    "zh-CN":
      typeof value["zh-CN"] === "string" ? value["zh-CN"] : fallback["zh-CN"],
  };
}

export function normalizeSolutionsPageSettings(
  value: unknown
): SolutionsPageSettings {
  const defaults = createDefaultSolutionsPageSettings();
  if (!isObject(value)) return defaults;

  const hero = isObject(value.hero) ? value.hero : {};
  const cta = isObject(value.cta) ? value.cta : {};

  const cropsRaw = Array.isArray(value.crops) ? value.crops : [];
  const bannersRaw = Array.isArray(value.banners) ? value.banners : [];

  const crops =
    cropsRaw.length > 0
      ? cropsRaw
          .filter(isObject)
          .map((crop, index) => {
            const byId = defaults.crops.find((item) => item.id === crop.id);
            const fallback = byId ?? defaults.crops[index] ?? defaults.crops[0]!;
            const description = normalizeLocalized(
              crop.description,
              fallback.description
            );
            // Promote legacy All Crops blurb to the verified copy.
            if (
              crop.id === "all" &&
              description.en.includes(
                "Discover how Oboya supports every stage of horticultural operations"
              )
            ) {
              return {
                id: "all" as SolutionsCropFilterId,
                label: normalizeLocalized(crop.label, fallback.label),
                description: { ...fallback.description },
                sectorTitle: normalizeLocalized(
                  crop.sectorTitle,
                  fallback.sectorTitle
                ),
                shop: normalizeShop(crop.shop),
              };
            }
            return {
              id: (typeof crop.id === "string"
                ? crop.id
                : fallback.id) as SolutionsCropFilterId,
              label: normalizeLocalized(crop.label, fallback.label),
              description,
              sectorTitle: normalizeLocalized(
                crop.sectorTitle,
                fallback.sectorTitle
              ),
              shop: normalizeShop(crop.shop),
            };
          })
      : defaults.crops;

  const LEGACY_BANNER_IMAGES = new Set([
  "/assets/homepage/capabilities-value-chain.jpg",
  "/assets/homepage/hero-vineyard.jpg",
  "/assets/homepage/solutions-integrated.jpg",
  "/assets/homepage/capabilities-partnerships.jpg",
  "/assets/homepage/solutions-logistics.jpg",
  "/assets/homepage/capabilities-global-local.jpg",
  "/assets/homepage/greenhouse-technology.webp",
]);

const banners =
    bannersRaw.length > 0
      ? bannersRaw.filter(isObject).map((banner, index) => {
          const byId = defaults.banners.find(
            (item) => item.id === banner.id
          );
          const fallback = byId ?? defaults.banners[index] ?? defaults.banners[0]!;
          const tagsRaw = Array.isArray(banner.tags) ? banner.tags : [];
          const rawImage =
            typeof banner.image === "string" && banner.image
              ? banner.image
              : "";
          const image =
            !rawImage || LEGACY_BANNER_IMAGES.has(rawImage)
              ? fallback.image
              : rawImage;
          return {
            id: typeof banner.id === "string" ? banner.id : fallback.id,
            image,
            title: normalizeLocalized(banner.title, fallback.title),
            tags:
              tagsRaw.length > 0
                ? tagsRaw.map((tag, tagIndex) =>
                    normalizeLocalized(
                      tag,
                      fallback.tags[tagIndex] ?? L("Tag")
                    )
                  )
                : fallback.tags,
            shop: normalizeShop(banner.shop, {
              bannerId: typeof banner.id === "string" ? banner.id : fallback.id,
            }),
          };
        })
      : defaults.banners;

  return {
    hero: {
      headline: normalizeLocalized(hero.headline, defaults.hero.headline),
      body: normalizeLocalized(hero.body, defaults.hero.body),
    },
    crops,
    banners,
    cta: {
      title: normalizeLocalized(cta.title, defaults.cta.title),
      description: normalizeLocalized(cta.description, defaults.cta.description),
      buttonLabel: normalizeLocalized(cta.buttonLabel, defaults.cta.buttonLabel),
      href:
        typeof cta.href === "string" && cta.href.trim()
          ? cta.href.trim()
          : defaults.cta.href,
    },
    updatedAt:
      typeof value.updatedAt === "string"
        ? value.updatedAt
        : defaults.updatedAt,
  };
}

let cache: SolutionsPageSettings | null = null;

export function getSolutionsPageSettings(): SolutionsPageSettings {
  if (!cache) cache = createDefaultSolutionsPageSettings();
  return cache;
}

export function replaceSolutionsPageSettingsCache(
  settings: SolutionsPageSettings
): void {
  cache = normalizeSolutionsPageSettings(settings);
}

export function saveSolutionsPageSettings(
  settings: SolutionsPageSettings
): SolutionsPageSettings {
  cache = normalizeSolutionsPageSettings({
    ...settings,
    updatedAt: new Date().toISOString(),
  });
  return cache;
}
