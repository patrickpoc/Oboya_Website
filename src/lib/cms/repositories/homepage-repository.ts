import type { LocalizedString } from "@/lib/cms/types";

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

const loc = (en: string): LocalizedString => ({
  en,
  "pt-BR": en,
  es: en,
  "zh-CN": en,
});

const emptyLoc = (): LocalizedString => ({
  en: "",
  "pt-BR": "",
  es: "",
  "zh-CN": "",
});

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
    eyebrow: loc("Solutions that work, value that grows."),
    title: loc("Your one-stop partner for horticulture"),
    description: loc(
      "Helping Horticulture Perform Better.\nFrom propagation to point of sale, Oboya helps growers and partners improve performance, protect quality, and strengthen supply chains — with global capability and local support."
    ),
    ctaPrimary: {
      label: loc("Request a quote"),
      href: "/contact",
    },
    ctaSecondary: {
      label: loc("Explore solutions"),
      href: "/solutions",
    },
    pills: [],
  },
  companyOverview: {
    headlineGreen: loc("Delivering solutions to horticultural businesses"),
    headlineWhite: loc(
      "around the world through a combination of global capabilities and local expertise."
    ),
    segments: [
      {
        text: loc("Delivering solutions to horticultural businesses"),
        tone: "green",
        breakBefore: false,
      },
      {
        text: loc(
          " around the world through a combination of global capabilities and local expertise."
        ),
        tone: "white",
        breakBefore: false,
      },
    ],
    image: "/assets/homepage/company-overview.webp",
    imageAlt: loc("Workers in a modern greenhouse facility"),
    stats: [
      {
        id: "employees",
        value: 600,
        suffix: "+",
        label: loc("Employees Across Global Operations"),
      },
      {
        id: "countries",
        value: 80,
        suffix: "+",
        label: loc("Countries Served Worldwide"),
      },
      {
        id: "experience",
        value: 20,
        suffix: "+",
        label: loc("Years Supporting Horticulture"),
      },
    ],
  },
  capabilities: {
    eyebrow: loc("Why Oboya Horticulture?"),
    title: loc(
      "Stories and strengths that define how we partner with growers worldwide."
    ),
    ctaLabel: loc("Learn more"),
    ctaHref: "/about",
    items: [
      {
        id: "built-challenges",
        title: loc("One Partner Across the Entire Value Chain"),
        description: loc(
          "From cultivation to commercialization, we help businesses improve performance, protect quality, and stay competitive across every stage of their operation."
        ),
        image: "/assets/homepage/capabilities-value-chain.jpg",
        href: "/about",
      },
      {
        id: "global-local",
        title: loc("Global Capabilities. Local Understanding."),
        description: loc(
          "A global network backed by international manufacturing, product development, and sourcing capabilities — with local responsiveness and deep horticulture expertise."
        ),
        image: "/assets/homepage/capabilities-global-local.jpg",
        href: "/about",
      },
      {
        id: "integrated-chain",
        title: loc("Partnerships Built for the Long Term"),
        description: loc(
          "Working alongside customers over time to support growth, adaptation, and lasting business performance."
        ),
        image: "/assets/homepage/capabilities-partnerships.jpg",
        href: "/about",
      },
    ],
  },
  businessSolutions: {
    eyebrow: loc("Solutions Built Around Your Business"),
    title: loc(
      "Every crop, operation, and supply chain has unique requirements — explore the solutions, expertise, and support designed for your sector."
    ),
    items: [
      {
        id: "flowers",
        title: loc("Flowers"),
        description: loc(
          "End-to-end solutions for floriculture operations — from propagation and packaging through to retail."
        ),
        image:
          "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=800&auto=format&fit=crop",
        href: "/solutions/flowers",
        ctaLabel: loc("Explore Solutions"),
      },
      {
        id: "vegetables",
        title: loc("Vegetables & Herbs"),
        description: loc(
          "Integrated solutions that support efficient production, handling, packaging, and commercialization."
        ),
        image:
          "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800&auto=format&fit=crop",
        href: "/solutions/vegetables",
        ctaLabel: loc("Explore Solutions"),
      },
      {
        id: "fruits",
        title: loc("Fruits"),
        description: loc(
          "Solutions that optimize cultivation, handling, packaging, and distribution across the fruit supply chain."
        ),
        image:
          "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=800&auto=format&fit=crop",
        href: "/solutions/fruits",
        ctaLabel: loc("Explore Solutions"),
      },
      {
        id: "logistics-display",
        title: loc("Logistics & Display"),
        description: loc(
          "Systems that improve product movement, merchandising, and point-of-sale presentation."
        ),
        image: "/assets/homepage/solutions-logistics.jpg",
        href: "/solutions/logistics-display",
        ctaLabel: loc("Explore Solutions"),
      },
      {
        id: "machinery-automation",
        title: loc("Machinery & Automation"),
        description: loc(
          "Technology that increases efficiency, consistency, and scalability as operations grow."
        ),
        image: "/assets/homepage/greenhouse-technology.webp",
        href: "/solutions/machinery-automation",
        ctaLabel: loc("Explore Solutions"),
      },
    ],
  },
  globalPresence: {
    title: loc(
      "We operate in 25 countries, with production hubs in Asia, South America and Europe, as well as support teams worldwide."
    ),
  },
  testimonials: {
    eyebrow: loc("Testimonials"),
    items: [
      {
        id: "t1",
        quote: loc(
          "Oboya helped us unify packaging and logistics across our greenhouse network. Delivery reliability improved within the first season."
        ),
        author: loc("Maria Jensen"),
        role: loc("Nordic Growers"),
      },
      {
        id: "t2",
        quote: loc(
          "Their local teams understood our retail requirements and delivered display solutions that lifted shelf presence without slowing operations."
        ),
        author: loc("Carlos Mendes"),
        role: loc("Fresh Retail Group"),
      },
      {
        id: "t3",
        quote: loc(
          "From substrates to retail-ready packaging, Oboya has become a long-term partner for our berry programs across Asia Pacific."
        ),
        author: loc("Li Wei"),
        role: loc("Asia Pacific Berries"),
      },
      {
        id: "t4",
        quote: loc(
          "We needed one partner for cultivation support and outbound logistics. Oboya connected both ends of the chain with clear accountability."
        ),
        author: loc("Elena Rossi"),
        role: loc("MediFlora Cooperative"),
      },
      {
        id: "t5",
        quote: loc(
          "Scale and local expertise rarely come together. With Oboya, we get global manufacturing strength and on-the-ground support where we grow."
        ),
        author: loc("James Okonkwo"),
        role: loc("GreenHorizon Farms"),
      },
      {
        id: "t6",
        quote: loc(
          "Switching to Oboya's integrated solutions cut complexity for our growers and gave our buyers a more consistent product experience."
        ),
        author: loc("Sophie Dubois"),
        role: loc("EuroFresh Alliance"),
      },
    ],
  },
  latestNews: {
    eyebrow: loc("Latest News"),
    headline: loc(
      "Learn more about our latest developments and stories from the field in our Latest News section."
    ),
    postCount: 2,
  },
  partners: {
    title: loc("Our collaborations"),
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
const CONTENT_REVISION = "home-remove-featured-innovations-2026-09-01";
let appliedRevision: string | null = null;

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

  return {
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
