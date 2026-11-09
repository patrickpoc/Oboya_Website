import type { LocalizedString } from "@/lib/cms/types";
import { HOME_I18N } from "@/lib/cms/homepage-i18n";
import { mergeLocalized } from "@/lib/cms/utils";

export type HomepageSectionId =
  | "hero"
  | "companyOverview"
  | "capabilities"
  | "businessSolutions"
  | "globalPresence"
  | "testimonials"
  | "latestNews"
  | "partners";

export interface HomepageSectionToggle {
  enabled: boolean;
}

export interface HomepageHeroPill {
  id: string;
  label: LocalizedString;
  sublabel: LocalizedString;
  href: string;
  icon: "logistics" | "research" | "plants" | "vegetable" | "flower" | "fruit";
  image?: string;
}

export interface HomepageHeroCta {
  label: LocalizedString;
  href: string;
}

export interface HomepageStat {
  id: string;
  value: number;
  suffix: string;
  label: LocalizedString;
}

export interface HomepageHeadlineSegment {
  text: LocalizedString;
  tone: "green" | "white";
  breakBefore?: boolean;
}

export interface HomepageCapability {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  image: string;
  href: string;
  ctaLabel?: LocalizedString;
}

export interface HomepageBusinessSolution {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  image?: string;
  href?: string;
  ctaLabel?: LocalizedString;
}

export interface HomepageTestimonial {
  id: string;
  quote: LocalizedString;
  author: LocalizedString;
  role: LocalizedString;
}

export interface HomepagePartnerLogo {
  id: string;
  name: string;
  image: string;
  href?: string;
}

export const HOME_ECOSYSTEM_STAGE_IDS = [
  "propagation",
  "growing",
  "harvest",
  "packaging",
  "logistics",
  "retail",
] as const;

export type HomeEcosystemStageId = (typeof HOME_ECOSYSTEM_STAGE_IDS)[number];

export const HOME_ECOSYSTEM_MAX_POINTS = 3;

/** Short product-line proof point shown next to the stage illustration. */
export interface HomeEcosystemPoint {
  id: string;
  text: LocalizedString;
}

export interface HomeEcosystemStage {
  id: HomeEcosystemStageId;
  label: LocalizedString;
  description: LocalizedString;
  /** Up to HOME_ECOSYSTEM_MAX_POINTS entries. */
  points: HomeEcosystemPoint[];
  /** "" shows the animated SVG scene. */
  image: string;
}

export interface HomepageSettings {
  animations: { enabled: boolean };
  sections: Record<HomepageSectionId, HomepageSectionToggle>;
  hero: {
    mediaType: "image" | "video";
    backgroundImage: string;
    backgroundVideo: string | null;
    eyebrow: LocalizedString;
    title: LocalizedString;
    description: LocalizedString;
    ctaPrimary: HomepageHeroCta;
    ctaSecondary: HomepageHeroCta;
    /** @deprecated Kept for migration; not shown on public hero */
    pills: HomepageHeroPill[];
  };
  companyOverview: {
    headlineGreen: LocalizedString;
    headlineWhite: LocalizedString;
    segments: HomepageHeadlineSegment[];
    image: string;
    imageAlt: LocalizedString;
    stats: HomepageStat[];
  };
  homeEcosystem: {
    title: LocalizedString;
    bodyP1: LocalizedString;
    bodyP2: LocalizedString;
    openingLine: LocalizedString;
    closingLine1: LocalizedString;
    closingLine2: LocalizedString;
    slogan: LocalizedString;
    stages: HomeEcosystemStage[];
  };
  capabilities: {
    eyebrow: LocalizedString;
    title: LocalizedString;
    ctaLabel: LocalizedString;
    ctaHref: string;
    items: HomepageCapability[];
  };
  businessSolutions: {
    eyebrow: LocalizedString;
    title: LocalizedString;
    items: HomepageBusinessSolution[];
  };
  globalPresence: {
    title: LocalizedString;
  };
  testimonials: {
    eyebrow: LocalizedString;
    items: HomepageTestimonial[];
  };
  latestNews: {
    eyebrow: LocalizedString;
    headline: LocalizedString;
    postCount: number;
  };
  partners: {
    title: LocalizedString;
    logos: HomepagePartnerLogo[];
  };
  updatedAt: string;
}

const emptyLoc = (): LocalizedString => ({
  en: "",
  "pt-BR": "",
  es: "",
  "zh-CN": "",
});

const H = HOME_I18N;
const E = H.homeEcosystem;

const defaultSettings = (): HomepageSettings => ({
  animations: { enabled: true },
  sections: {
    hero: { enabled: true },
    companyOverview: { enabled: true },
    capabilities: { enabled: true },
    businessSolutions: { enabled: true },
    globalPresence: { enabled: true },
    testimonials: { enabled: true },
    latestNews: { enabled: true },
    partners: { enabled: true },
  },
  hero: {
    mediaType: "video",
    backgroundImage: "/assets/homepage/hero-vineyard.jpg",
    backgroundVideo: "/assets/homepage/hero-hands-herbs.mp4",
    eyebrow: H.hero.eyebrow,
    title: H.hero.title,
    description: H.hero.description,
    ctaPrimary: {
      label: H.hero.ctaPrimary,
      href: "/contact",
    },
    ctaSecondary: {
      label: H.hero.ctaSecondary,
      href: "/solutions",
    },
    pills: [],
  },
  companyOverview: {
    headlineGreen: H.companyOverview.headlineGreen,
    headlineWhite: H.companyOverview.headlineWhite,
    segments: [
      {
        text: H.companyOverview.segmentGreen,
        tone: "green",
        breakBefore: false,
      },
      {
        text: H.companyOverview.segmentWhite,
        tone: "white",
        breakBefore: false,
      },
    ],
    image: "/assets/homepage/company-overview.webp",
    imageAlt: H.companyOverview.imageAlt,
    stats: [
      {
        id: "employees",
        value: 600,
        suffix: "+",
        label: H.companyOverview.statEmployees,
      },
      {
        id: "countries",
        value: 80,
        suffix: "+",
        label: H.companyOverview.statCountries,
      },
      {
        id: "experience",
        value: 20,
        suffix: "+",
        label: H.companyOverview.statExperience,
      },
    ],
  },
  homeEcosystem: {
    title: E.title,
    bodyP1: E.bodyP1,
    bodyP2: E.bodyP2,
    openingLine: E.openingLine,
    closingLine1: E.closingLine1,
    closingLine2: E.closingLine2,
    slogan: E.slogan,
    stages: HOME_ECOSYSTEM_STAGE_IDS.map((id) => ({
      id,
      label: E.stages[id],
      description: E.descriptions[id],
      points: Object.entries(E.points[id]).map(([pid, text]) => ({ id: pid, text })),
      image: "",
    })),
  },
  capabilities: {
    eyebrow: H.capabilities.eyebrow,
    title: H.capabilities.title,
    ctaLabel: H.capabilities.ctaLabel,
    ctaHref: "/about",
    items: [
      {
        id: "built-challenges",
        title: H.capabilities.item1Title,
        description: H.capabilities.item1Desc,
        image: "/assets/homepage/capabilities-value-chain.jpg",
        href: "/about",
      },
      {
        id: "global-local",
        title: H.capabilities.item2Title,
        description: H.capabilities.item2Desc,
        image: "/assets/homepage/capabilities-global-local.jpg",
        href: "/about",
      },
      {
        id: "integrated-chain",
        title: H.capabilities.item3Title,
        description: H.capabilities.item3Desc,
        image: "/assets/homepage/capabilities-partnerships.jpg",
        href: "/about",
      },
    ],
  },
  businessSolutions: {
    eyebrow: H.businessSolutions.eyebrow,
    title: H.businessSolutions.title,
    items: [
      {
        id: "flowers",
        title: H.businessSolutions.flowersTitle,
        description: H.businessSolutions.flowersDesc,
        image:
          "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=800&auto=format&fit=crop",
        href: "/solutions?area=flowers",
        ctaLabel: H.businessSolutions.cta,
      },
      {
        id: "vegetables",
        title: H.businessSolutions.vegetablesTitle,
        description: H.businessSolutions.vegetablesDesc,
        image:
          "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800&auto=format&fit=crop",
        href: "/solutions?area=vegetables",
        ctaLabel: H.businessSolutions.cta,
      },
      {
        id: "fruits",
        title: H.businessSolutions.fruitsTitle,
        description: H.businessSolutions.fruitsDesc,
        image:
          "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=800&auto=format&fit=crop",
        href: "/solutions?area=fruits",
        ctaLabel: H.businessSolutions.cta,
      },
      {
        id: "logistics-display",
        title: H.businessSolutions.logisticsTitle,
        description: H.businessSolutions.logisticsDesc,
        image: "/assets/homepage/solutions-logistics.jpg",
        href: "/solutions?area=all",
        ctaLabel: H.businessSolutions.cta,
      },
      {
        id: "machinery-automation",
        title: H.businessSolutions.machineryTitle,
        description: H.businessSolutions.machineryDesc,
        image: "/assets/homepage/greenhouse-technology.webp",
        href: "/solutions?area=all",
        ctaLabel: H.businessSolutions.cta,
      },
    ],
  },
  globalPresence: {
    title: H.globalPresence.title,
  },
  testimonials: {
    eyebrow: H.testimonials.eyebrow,
    items: [
      {
        id: "t1",
        quote: H.testimonials.t1Quote,
        author: H.testimonials.t1Author,
        role: H.testimonials.t1Role,
      },
      {
        id: "t2",
        quote: H.testimonials.t2Quote,
        author: H.testimonials.t2Author,
        role: H.testimonials.t2Role,
      },
      {
        id: "t3",
        quote: H.testimonials.t3Quote,
        author: H.testimonials.t3Author,
        role: H.testimonials.t3Role,
      },
      {
        id: "t4",
        quote: H.testimonials.t4Quote,
        author: H.testimonials.t4Author,
        role: H.testimonials.t4Role,
      },
      {
        id: "t5",
        quote: H.testimonials.t5Quote,
        author: H.testimonials.t5Author,
        role: H.testimonials.t5Role,
      },
      {
        id: "t6",
        quote: H.testimonials.t6Quote,
        author: H.testimonials.t6Author,
        role: H.testimonials.t6Role,
      },
    ],
  },
  latestNews: {
    eyebrow: H.latestNews.eyebrow,
    headline: H.latestNews.headline,
    postCount: 2,
  },
  partners: {
    title: H.partners.title,
    logos: [
      { id: "brcgs", name: "BRCGS", image: "/assets/homepage/cert-brcgs.png", href: "" },
      { id: "sedex-smeta", name: "Sedex | SMETA", image: "/assets/homepage/cert-sedex-smeta.png", href: "" },
      { id: "grs", name: "Global Recycled Standard", image: "/assets/homepage/cert-grs.png", href: "" },
      { id: "iso", name: "ISO 9001:2015", image: "/assets/homepage/cert-iso-9001.png", href: "" },
    ],
  },
  updatedAt: new Date().toISOString(),
});

let cache: HomepageSettings | null = null;
const CONTENT_REVISION = "home-i18n-2026-09-02";
let appliedRevision: string | null = null;

const LOCALE_KEYS = ["en", "pt-BR", "es", "zh-CN"] as const;

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}

/** Keeps only string locale values; undefined when nothing usable is stored. */
function asLoc(v: unknown): LocalizedString | undefined {
  const r = asRecord(v);
  if (!r) return undefined;
  const out = emptyLoc();
  for (const k of LOCALE_KEYS) if (typeof r[k] === "string") out[k] = r[k] as string;
  return out;
}


/**
 * Accepts only images next/image can render: local /uploads or /assets, or https
 * on the configured Supabase host under /storage/v1/object/public/. Else "".
 */
export function sanitizeHomeEcosystemImage(value: unknown): string {
  if (typeof value !== "string") return "";
  const v = value.trim();
  if (!v || /[\\\s]/.test(v)) return "";
  if (v.startsWith("/")) {
    if (/[?#]/.test(v) || !isSafeImagePath(v)) return "";
    return v.startsWith("/uploads/") || v.startsWith("/assets/") ? v : "";
  }
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return "";
  try {
    const url = new URL(v);
    if (
      url.protocol !== "https:" ||
      url.host !== new URL(raw).host ||
      url.username ||
      url.password ||
      !url.pathname.startsWith("/storage/v1/object/public/") ||
      !isSafeImagePath(url.pathname)
    )
      return "";
    return url.origin + url.pathname;
  } catch {
    return "";
  }
}

/** Decodes up to 3 times, then rejects traversal, doubled slashes, backslashes, control chars and non-raster extensions. */
function isSafeImagePath(path: string): boolean {
  let d = path;
  try {
    for (let i = 0; i < 3; i++) d = decodeURIComponent(d);
  } catch {
    return false;
  }
  if (d.includes("..") || d.includes("//") || /[\\\u0000-\u001f\u007f]/.test(d)) return false;
  return /\.(jpe?g|png|webp|avif|gif)$/i.test(d);
}

const isBlankLoc = (v: LocalizedString) => LOCALE_KEYS.every((k) => !v[k].trim());

/**
 * Stored points keep their order and are filled from the default with the same id;
 * entries blank in every locale are dropped; capped at HOME_ECOSYSTEM_MAX_POINTS;
 * defaults apply when nothing is stored. Legacy `items` are never read.
 */
function migrateEcosystemPoints(
  stored: unknown,
  defaults: HomeEcosystemPoint[]
): HomeEcosystemPoint[] {
  if (!Array.isArray(stored)) return defaults;
  const points: HomeEcosystemPoint[] = [];
  for (const entry of stored) {
    const r = asRecord(entry);
    const text = asLoc(r?.text);
    if (!r || typeof r.id !== "string" || !text) continue;
    const def = defaults.find((d) => d.id === r.id);
    const merged = def ? mergeLocalized(text, def.text) : text;
    if (!isBlankLoc(merged)) points.push({ id: r.id, text: merged });
  }
  return points.slice(0, HOME_ECOSYSTEM_MAX_POINTS);
}

function migrateEcosystem(
  stored: unknown,
  defaults: HomepageSettings["homeEcosystem"]
): HomepageSettings["homeEcosystem"] {
  const raw = asRecord(stored) ?? {};
  const storedStages = Array.isArray(raw.stages) ? raw.stages : [];
  const text = (k: keyof HomepageSettings["homeEcosystem"]) =>
    asLoc(raw[k]) ?? (defaults[k] as LocalizedString);
  return {
    title: text("title"),
    bodyP1: text("bodyP1"),
    bodyP2: text("bodyP2"),
    openingLine: text("openingLine"),
    closingLine1: text("closingLine1"),
    closingLine2: text("closingLine2"),
    slogan: text("slogan"),
    stages: defaults.stages.map((def) => {
      const st = storedStages
        .map(asRecord)
        .find((s) => s?.id === def.id);
      return {
        id: def.id,
        label: asLoc(st?.label) ?? def.label,
        description: asLoc(st?.description) ?? def.description,
        points: migrateEcosystemPoints(st?.points, def.points),
        image: sanitizeHomeEcosystemImage(st?.image),
      };
    }),
  };
}

function mergeHomepageLocales(
  current: HomepageSettings,
  defaults: HomepageSettings
): HomepageSettings {
  const eco = current.homeEcosystem;
  const ecoDef = defaults.homeEcosystem;
  return {
    ...current,
    homeEcosystem: {
      title: mergeLocalized(eco.title, ecoDef.title),
      bodyP1: mergeLocalized(eco.bodyP1, ecoDef.bodyP1),
      bodyP2: mergeLocalized(eco.bodyP2, ecoDef.bodyP2),
      openingLine: mergeLocalized(eco.openingLine, ecoDef.openingLine),
      closingLine1: mergeLocalized(eco.closingLine1, ecoDef.closingLine1),
      closingLine2: mergeLocalized(eco.closingLine2, ecoDef.closingLine2),
      slogan: mergeLocalized(eco.slogan, ecoDef.slogan),
      stages: eco.stages.map((stage, i) => {
        const def = ecoDef.stages[i];
        return {
          ...stage,
          label: mergeLocalized(stage.label, def.label),
          description: mergeLocalized(stage.description, def.description),
          points: stage.points.map((pt) => {
            const defPt = def.points.find((d) => d.id === pt.id);
            return defPt ? { ...pt, text: mergeLocalized(pt.text, defPt.text) } : pt;
          }),
        };
      }),
    },
    hero: {
      ...current.hero,
      eyebrow: mergeLocalized(current.hero.eyebrow, defaults.hero.eyebrow),
      title: mergeLocalized(current.hero.title, defaults.hero.title),
      description: mergeLocalized(
        current.hero.description,
        defaults.hero.description
      ),
      ctaPrimary: {
        ...current.hero.ctaPrimary,
        label: mergeLocalized(
          current.hero.ctaPrimary.label,
          defaults.hero.ctaPrimary.label
        ),
      },
      ctaSecondary: {
        ...current.hero.ctaSecondary,
        label: mergeLocalized(
          current.hero.ctaSecondary.label,
          defaults.hero.ctaSecondary.label
        ),
      },
    },
    companyOverview: {
      ...current.companyOverview,
      headlineGreen: mergeLocalized(
        current.companyOverview.headlineGreen,
        defaults.companyOverview.headlineGreen
      ),
      headlineWhite: mergeLocalized(
        current.companyOverview.headlineWhite,
        defaults.companyOverview.headlineWhite
      ),
      imageAlt: mergeLocalized(
        current.companyOverview.imageAlt,
        defaults.companyOverview.imageAlt
      ),
      segments: current.companyOverview.segments.map((segment, i) => ({
        ...segment,
        text: mergeLocalized(
          segment.text,
          defaults.companyOverview.segments[i]?.text ?? segment.text
        ),
      })),
      stats: current.companyOverview.stats.map((stat, i) => ({
        ...stat,
        label: mergeLocalized(
          stat.label,
          defaults.companyOverview.stats[i]?.label ?? stat.label
        ),
      })),
    },
    capabilities: {
      ...current.capabilities,
      eyebrow: mergeLocalized(
        current.capabilities.eyebrow,
        defaults.capabilities.eyebrow
      ),
      title: mergeLocalized(current.capabilities.title, defaults.capabilities.title),
      ctaLabel: mergeLocalized(
        current.capabilities.ctaLabel,
        defaults.capabilities.ctaLabel
      ),
      items: current.capabilities.items.map((item, i) => ({
        ...item,
        title: mergeLocalized(
          item.title,
          defaults.capabilities.items[i]?.title ?? item.title
        ),
        description: mergeLocalized(
          item.description,
          defaults.capabilities.items[i]?.description ?? item.description
        ),
        ctaLabel: item.ctaLabel
          ? mergeLocalized(
              item.ctaLabel,
              defaults.capabilities.items[i]?.ctaLabel ?? item.ctaLabel
            )
          : item.ctaLabel,
      })),
    },
    businessSolutions: {
      ...current.businessSolutions,
      eyebrow: mergeLocalized(
        current.businessSolutions.eyebrow,
        defaults.businessSolutions.eyebrow
      ),
      title: mergeLocalized(
        current.businessSolutions.title,
        defaults.businessSolutions.title
      ),
      items: current.businessSolutions.items.map((item, i) => ({
        ...item,
        title: mergeLocalized(
          item.title,
          defaults.businessSolutions.items[i]?.title ?? item.title
        ),
        description: mergeLocalized(
          item.description,
          defaults.businessSolutions.items[i]?.description ?? item.description
        ),
        ctaLabel: item.ctaLabel
          ? mergeLocalized(
              item.ctaLabel,
              defaults.businessSolutions.items[i]?.ctaLabel ?? item.ctaLabel
            )
          : item.ctaLabel,
      })),
    },
    globalPresence: {
      ...current.globalPresence,
      title: mergeLocalized(
        current.globalPresence.title,
        defaults.globalPresence.title
      ),
    },
    testimonials: {
      ...current.testimonials,
      eyebrow: mergeLocalized(
        current.testimonials.eyebrow,
        defaults.testimonials.eyebrow
      ),
      items: current.testimonials.items.map((item, i) => ({
        ...item,
        quote: mergeLocalized(
          item.quote,
          defaults.testimonials.items[i]?.quote ?? item.quote
        ),
        author: mergeLocalized(
          item.author,
          defaults.testimonials.items[i]?.author ?? item.author
        ),
        role: mergeLocalized(
          item.role,
          defaults.testimonials.items[i]?.role ?? item.role
        ),
      })),
    },
    latestNews: {
      ...current.latestNews,
      eyebrow: mergeLocalized(
        current.latestNews.eyebrow,
        defaults.latestNews.eyebrow
      ),
      headline: mergeLocalized(
        current.latestNews.headline,
        defaults.latestNews.headline
      ),
    },
    partners: {
      ...current.partners,
      title: mergeLocalized(current.partners.title, defaults.partners.title),
    },
  };
}

function migrateSettings(settings: HomepageSettings): HomepageSettings {
  const defaults = defaultSettings();
  const { featuredProducts: _legacyFeatured, ...withoutLegacy } =
    settings as HomepageSettings & { featuredProducts?: unknown };
  const rawHero = withoutLegacy.hero as HomepageSettings["hero"] & {
    ctaPrimary?: HomepageHeroCta;
    ctaSecondary?: HomepageHeroCta;
    mediaType?: "image" | "video";
    backgroundVideo?: string | null;
  };

  const mediaType: "image" | "video" =
    rawHero?.mediaType === "video" || rawHero?.mediaType === "image"
      ? rawHero.mediaType
      : "image";

  const migrated: HomepageSettings = {
    ...defaults,
    ...withoutLegacy,
    animations: {
      enabled: withoutLegacy.animations?.enabled ?? defaults.animations.enabled,
    },
    hero: {
      ...defaults.hero,
      ...withoutLegacy.hero,
      mediaType,
      backgroundImage:
        withoutLegacy.hero?.backgroundImage || defaults.hero.backgroundImage,
      backgroundVideo:
        rawHero?.backgroundVideo !== undefined
          ? rawHero.backgroundVideo
          : mediaType === "video"
            ? defaults.hero.backgroundVideo
            : null,
      ctaPrimary: {
        ...defaults.hero.ctaPrimary,
        ...rawHero?.ctaPrimary,
        label: rawHero?.ctaPrimary?.label ?? defaults.hero.ctaPrimary.label,
        href: rawHero?.ctaPrimary?.href ?? defaults.hero.ctaPrimary.href,
      },
      ctaSecondary: {
        ...defaults.hero.ctaSecondary,
        ...rawHero?.ctaSecondary,
        label: rawHero?.ctaSecondary?.label ?? defaults.hero.ctaSecondary.label,
        href: rawHero?.ctaSecondary?.href ?? defaults.hero.ctaSecondary.href,
      },
      pills: withoutLegacy.hero?.pills?.length
        ? withoutLegacy.hero.pills
        : defaults.hero.pills,
    },
    companyOverview: {
      ...defaults.companyOverview,
      ...withoutLegacy.companyOverview,
      segments:
        withoutLegacy.companyOverview?.segments?.length > 0
          ? withoutLegacy.companyOverview.segments
          : defaults.companyOverview.segments,
      stats: (
        withoutLegacy.companyOverview?.stats?.length > 0
          ? withoutLegacy.companyOverview.stats
          : defaults.companyOverview.stats
      ).slice(0, 3),
    },
    homeEcosystem: migrateEcosystem(
      (withoutLegacy as { homeEcosystem?: unknown }).homeEcosystem,
      defaults.homeEcosystem
    ),
    capabilities: {
      ...defaults.capabilities,
      ...withoutLegacy.capabilities,
      items: withoutLegacy.capabilities?.items?.length
        ? withoutLegacy.capabilities.items.map((item, i) => ({
            ...defaults.capabilities.items[i],
            ...item,
            ctaLabel:
              item.ctaLabel ?? defaults.capabilities.items[i]?.ctaLabel,
          }))
        : defaults.capabilities.items,
    },
    businessSolutions: {
      ...defaults.businessSolutions,
      ...withoutLegacy.businessSolutions,
      items: (() => {
        const raw = withoutLegacy.businessSolutions?.items;
        if (!raw?.length) return defaults.businessSolutions.items;
        const mapped: HomepageBusinessSolution[] = raw.map((item, i) => {
          const fallback = defaults.businessSolutions.items[i];
          return {
            ...fallback,
            ...item,
            id: item.id ?? fallback?.id ?? `solution-${i}`,
            title: item.title ?? fallback?.title ?? emptyLoc(),
            description: item.description ?? fallback?.description ?? emptyLoc(),
            ctaLabel: item.ctaLabel ?? fallback?.ctaLabel,
            image: item.image || fallback?.image || "",
            href: item.href || fallback?.href || "/solutions",
          };
        });
        if (mapped.length >= defaults.businessSolutions.items.length) {
          return mapped;
        }
        const seen = new Set(mapped.map((m) => m.id));
        const padded: HomepageBusinessSolution[] = [...mapped];
        for (const fallback of defaults.businessSolutions.items) {
          if (padded.length >= defaults.businessSolutions.items.length) break;
          if (seen.has(fallback.id)) continue;
          padded.push(fallback);
          seen.add(fallback.id);
        }
        return padded;
      })(),
    },
    globalPresence: {
      ...defaults.globalPresence,
      ...withoutLegacy.globalPresence,
    },
    testimonials: {
      ...defaults.testimonials,
      ...withoutLegacy.testimonials,
    },
    latestNews: { ...defaults.latestNews, ...withoutLegacy.latestNews },
    partners: { ...defaults.partners, ...withoutLegacy.partners },
    sections: {
      ...defaults.sections,
      hero: {
        enabled:
          withoutLegacy.sections?.hero?.enabled ?? defaults.sections.hero.enabled,
      },
      companyOverview: {
        enabled:
          withoutLegacy.sections?.companyOverview?.enabled ??
          defaults.sections.companyOverview.enabled,
      },
      capabilities: {
        enabled:
          withoutLegacy.sections?.capabilities?.enabled ??
          defaults.sections.capabilities.enabled,
      },
      businessSolutions: {
        enabled:
          withoutLegacy.sections?.businessSolutions?.enabled ??
          defaults.sections.businessSolutions.enabled,
      },
      globalPresence: {
        enabled:
          withoutLegacy.sections?.globalPresence?.enabled ??
          defaults.sections.globalPresence.enabled,
      },
      testimonials: {
        enabled:
          withoutLegacy.sections?.testimonials?.enabled ??
          defaults.sections.testimonials.enabled,
      },
      latestNews: {
        enabled:
          withoutLegacy.sections?.latestNews?.enabled ??
          defaults.sections.latestNews.enabled,
      },
      partners: {
        enabled:
          withoutLegacy.sections?.partners?.enabled ??
          defaults.sections.partners.enabled,
      },
    },
  };
  return mergeHomepageLocales(migrated, defaults);
}

export function getHomepageSettings(): HomepageSettings {
  if (appliedRevision !== CONTENT_REVISION) {
    cache = defaultSettings();
    appliedRevision = CONTENT_REVISION;
  }
  if (!cache) cache = defaultSettings();
  return migrateSettings(cache);
}

export function replaceHomepageSettingsCache(settings: HomepageSettings) {
  cache = migrateSettings(settings);
  appliedRevision = CONTENT_REVISION;
}

export function saveHomepageSettings(settings: HomepageSettings): HomepageSettings {
  const updated = migrateSettings({
    ...settings,
    updatedAt: new Date().toISOString(),
  });
  cache = updated;
  appliedRevision = CONTENT_REVISION;
  return updated;
}

export function resetHomepageSettings(): HomepageSettings {
  cache = defaultSettings();
  appliedRevision = CONTENT_REVISION;
  return cache;
}
