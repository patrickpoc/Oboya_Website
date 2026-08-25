import type { LocalizedString } from "@/lib/cms/types";

export type HomepageSectionId =
  | "hero"
  | "companyOverview"
  | "capabilities"
  | "businessSolutions"
  | "globalPresence"
  | "testimonials"
  | "featuredProducts"
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

/** Featured Innovations card (legacy `categoryId` optional for migration). */
export interface HomepageInnovation {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  image: string;
  ctaLabel?: LocalizedString;
  ctaHref?: string;
  /** @deprecated Shop category link — ignored on public innovations UI */
  categoryId?: string;
}

/** @deprecated Use HomepageInnovation */
export type HomepageFeaturedCategory = HomepageInnovation;

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
    backgroundImage: string;
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
  featuredProducts: {
    eyebrow: LocalizedString;
    title: LocalizedString;
    ctaLabel: LocalizedString;
    ctaHref: string;
    items: HomepageInnovation[];
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
    featuredProducts: { enabled: true },
    latestNews: { enabled: true },
    partners: { enabled: true },
  },
  hero: {
    backgroundImage: "/assets/homepage/hero-vineyard.jpg",
    eyebrow: loc("Solutions that work, value that grows."),
    title: loc("Your one-stop partner\nfor horticulture!"),
    description: loc(
      "Through integrated solutions for cultivation, packaging, logistics, transport systems, retail display, and technical advisory services, Oboya supports the businesses that keep horticulture moving forward."
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
        title: loc("Built Around Real Challenges"),
        description: loc(
          "Through integrated solutions for cultivation, packaging, logistics, transport systems, retail display, and technical advisory services, Oboya supports the businesses that keep horticulture moving forward."
        ),
        image: "/assets/homepage/solutions-integrated.jpg",
        href: "/about",
      },
      {
        id: "global-local",
        title: loc("Global Reach, Local Expertise"),
        description: loc(
          "Worldwide manufacturing backed by localized production, support, and deep horticulture knowledge."
        ),
        image: "/assets/homepage/solutions-global.jpg",
        href: "/about",
      },
      {
        id: "integrated-chain",
        title: loc("One Partner Across The Chain"),
        description: loc(
          "Propagation, packaging, and logistics connected — so growers focus on growing, not juggling suppliers."
        ),
        image: "/assets/homepage/solutions-logistics.jpg",
        href: "/about",
      },
    ],
  },
  businessSolutions: {
    eyebrow: loc("Solutions Tailored to Your Business"),
    title: loc(
      "Every crop, operation, and supply chain has unique requirements. Explore the solutions, expertise, and support designed for your sector."
    ),
    items: [
      {
        id: "flowers",
        title: loc("Flowers"),
        description: loc(
          "Solutions for growers, exporters, distributors, and retailers across the floriculture industry."
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
          "Integrated solutions that support efficient production, handling, logistics, and commercialization."
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
          "Solutions designed to protect quality, improve handling, and optimize supply chain performance."
        ),
        image:
          "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=800&auto=format&fit=crop",
        href: "/solutions/fruits",
        ctaLabel: loc("Explore Solutions"),
      },
      {
        id: "plants",
        title: loc("Plants"),
        description: loc(
          "Young-plant systems and logistics tools that standardize quality across nursery networks."
        ),
        image:
          "https://images.unsplash.com/photo-1466692476867-a0881dfc0648?q=80&w=800&auto=format&fit=crop",
        href: "/solutions",
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
  featuredProducts: {
    eyebrow: loc("Featured Innovations"),
    title: loc(
      "At OBOYA, we go beyond supplying products, we deliver integrated horticulture solutions designed to improve efficiency, optimize operations, and support long-term growth across the global supply chain."
    ),
    ctaLabel: loc("See all products"),
    ctaHref: "/shop",
    items: [
      {
        id: "innov-ecovaso",
        title: loc("Oboya Ecovaso"),
        description: loc(
          "Sustainable growing containers engineered for healthier roots and cleaner retail presentation."
        ),
        image:
          "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800&auto=format&fit=crop",
        ctaLabel: loc("Learn More"),
        ctaHref: "/shop",
      },
      {
        id: "innov-bioglitter",
        title: loc("Bioglitter"),
        description: loc(
          "Decorative finishes that add shelf impact while supporting more responsible material choices."
        ),
        image:
          "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=800&auto=format&fit=crop",
        ctaLabel: loc("Learn More"),
        ctaHref: "/shop",
      },
      {
        id: "innov-display",
        title: loc("Retail Display Systems"),
        description: loc(
          "Display and handling solutions that protect product quality from greenhouse floor to store shelf."
        ),
        image:
          "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=800&auto=format&fit=crop",
        ctaLabel: loc("Learn More"),
        ctaHref: "/shop",
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
const CONTENT_REVISION = "home-overview-3-stats-2026-08-11";
let appliedRevision: string | null = null;

function migrateSettings(settings: HomepageSettings): HomepageSettings {
  const defaults = defaultSettings();
  const rawHero = settings.hero as HomepageSettings["hero"] & {
    ctaPrimary?: HomepageHeroCta;
    ctaSecondary?: HomepageHeroCta;
    /** Legacy field used by older admin saves / seeds */
    image?: string;
  };
  const backgroundImage =
    rawHero?.backgroundImage ||
    rawHero?.image ||
    defaults.hero.backgroundImage;

  return {
    ...defaults,
    ...settings,
    animations: {
      enabled: settings.animations?.enabled ?? defaults.animations.enabled,
    },
    hero: {
      ...defaults.hero,
      ...settings.hero,
      backgroundImage,
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
      pills: settings.hero?.pills?.length
        ? settings.hero.pills
        : defaults.hero.pills,
    },
    companyOverview: {
      ...defaults.companyOverview,
      ...settings.companyOverview,
      segments:
        settings.companyOverview?.segments?.length > 0
          ? settings.companyOverview.segments
          : defaults.companyOverview.segments,
      stats: (
        settings.companyOverview?.stats?.length > 0
          ? settings.companyOverview.stats
          : defaults.companyOverview.stats
      ).slice(0, 3),
    },
    capabilities: {
      ...defaults.capabilities,
      ...settings.capabilities,
      items: settings.capabilities?.items?.length
        ? settings.capabilities.items.map((item, i) => ({
            ...defaults.capabilities.items[i],
            ...item,
            ctaLabel:
              item.ctaLabel ?? defaults.capabilities.items[i]?.ctaLabel,
          }))
        : defaults.capabilities.items,
    },
    businessSolutions: {
      ...defaults.businessSolutions,
      ...settings.businessSolutions,
      items: settings.businessSolutions?.items?.length
        ? settings.businessSolutions.items.map((item, i) => ({
            ...defaults.businessSolutions.items[i],
            ...item,
            title: item.title ?? defaults.businessSolutions.items[i]?.title ?? emptyLoc(),
            description:
              item.description ??
              defaults.businessSolutions.items[i]?.description ??
              emptyLoc(),
            ctaLabel:
              item.ctaLabel ?? defaults.businessSolutions.items[i]?.ctaLabel,
          }))
        : defaults.businessSolutions.items,
    },
    globalPresence: { ...defaults.globalPresence, ...settings.globalPresence },
    testimonials: { ...defaults.testimonials, ...settings.testimonials },
    featuredProducts: {
      ...defaults.featuredProducts,
      ...settings.featuredProducts,
      items: (() => {
        const raw = settings.featuredProducts?.items;
        if (!raw?.length) return defaults.featuredProducts.items;
        const mapped: HomepageInnovation[] = raw.map((item, i) => {
          const fallback = defaults.featuredProducts.items[i];
          const title =
            item.title && Object.values(item.title).some(Boolean)
              ? item.title
              : fallback?.title ?? emptyLoc();
          const description =
            item.description && Object.values(item.description).some(Boolean)
              ? item.description
              : fallback?.description ?? emptyLoc();
          return {
            id: item.id ?? fallback?.id ?? `innov-${i}`,
            title,
            description,
            image: item.image || fallback?.image || "",
            ctaLabel: item.ctaLabel ?? fallback?.ctaLabel,
            ctaHref: item.ctaHref ?? fallback?.ctaHref,
            categoryId: item.categoryId,
          };
        });
        // Always keep a full 3-card innovations row when CMS has fewer items
        if (mapped.length >= defaults.featuredProducts.items.length) {
          return mapped;
        }
        const seen = new Set(mapped.map((m) => m.id));
        const padded: HomepageInnovation[] = [...mapped];
        for (const fallback of defaults.featuredProducts.items) {
          if (padded.length >= defaults.featuredProducts.items.length) break;
          if (seen.has(fallback.id)) continue;
          padded.push(fallback);
          seen.add(fallback.id);
        }
        return padded;
      })(),
    },
    latestNews: { ...defaults.latestNews, ...settings.latestNews },
    partners: { ...defaults.partners, ...settings.partners },
    sections: {
      ...defaults.sections,
      ...settings.sections,
      businessSolutions: {
        enabled:
          settings.sections?.businessSolutions?.enabled ??
          defaults.sections.businessSolutions.enabled,
      },
    },
  };
}

export function getHomepageSettings(): HomepageSettings {
  if (!cache) cache = defaultSettings();
  return migrateSettings(cache);
}

export function replaceHomepageSettingsCache(
  settings: HomepageSettings
): HomepageSettings {
  const updated = migrateSettings({
    ...settings,
    updatedAt: settings.updatedAt ?? new Date().toISOString(),
  });
  cache = updated;
  appliedRevision = CONTENT_REVISION;
  return updated;
}

export function saveHomepageSettings(settings: HomepageSettings): HomepageSettings {
  return replaceHomepageSettingsCache({
    ...settings,
    updatedAt: new Date().toISOString(),
  });
}

export function resetHomepageSettings(): HomepageSettings {
  cache = defaultSettings();
  appliedRevision = CONTENT_REVISION;
  return cache;
}
