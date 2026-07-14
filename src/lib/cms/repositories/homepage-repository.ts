import type { LocalizedString } from "@/lib/cms/types";

export type HomepageSectionId =
  | "hero"
  | "companyOverview"
  | "capabilities"
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
  /** Circular photo asset for the hero glass pill */
  image?: string;
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
  /** Start a new visual line before this segment (default true except first) */
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

export interface HomepageTestimonial {
  id: string;
  quote: LocalizedString;
  author: LocalizedString;
  role: LocalizedString;
}

export interface HomepageFeaturedCategory {
  id: string;
  /** Shop category id from `data/shop/categories.json` */
  categoryId: string;
  /** Optional display title override */
  title?: LocalizedString;
  /** Optional short description under the category name */
  description?: LocalizedString;
  /** Optional cover image (defaults to first product in the category) */
  image?: string;
}

export interface HomepagePartnerLogo {
  id: string;
  name: string;
  image: string;
  href?: string;
}

export interface HomepageSettings {
  sections: Record<HomepageSectionId, HomepageSectionToggle>;
  hero: {
    backgroundImage: string;
    eyebrow: LocalizedString;
    title: LocalizedString;
    description: LocalizedString;
    pills: HomepageHeroPill[];
  };
  companyOverview: {
    /** @deprecated Prefer `segments` for multi-highlight headlines */
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
    items: HomepageFeaturedCategory[];
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

const defaultSettings = (): HomepageSettings => ({
  sections: {
    hero: { enabled: true },
    companyOverview: { enabled: true },
    capabilities: { enabled: true },
    globalPresence: { enabled: true },
    testimonials: { enabled: true },
    featuredProducts: { enabled: true },
    latestNews: { enabled: true },
    partners: { enabled: true },
  },
  hero: {
    backgroundImage:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop",
    eyebrow: loc("Global Partner"),
    title: loc("Your one-stop partner\nfor horticulture!"),
    description: loc(
      "Integrated solutions from propagation to packaging and retail display, trusted by growers in 80+ countries Worldwide"
    ),
    pills: [
      {
        id: "vegetable",
        label: loc("Vegetable"),
        sublabel: loc("Agribusiness"),
        href: "/solutions/vegetables",
        icon: "vegetable",
        image: "/assets/homepage/hero-pill-logistics.png",
      },
      {
        id: "fruit",
        label: loc("Fruit"),
        sublabel: loc("Agribusiness"),
        href: "/solutions/fruits",
        icon: "fruit",
        image: "/assets/homepage/hero-pill-rd.png",
      },
      {
        id: "flower",
        label: loc("Flower"),
        sublabel: loc("Agribusiness"),
        href: "/solutions/flowers",
        icon: "flower",
        image: "/assets/homepage/hero-pill-plants.png",
      },
    ],
  },
  companyOverview: {
    headlineGreen: loc("We support the entire horticultural supply chain:"),
    headlineWhite: loc(
      "from propagation and planting to packaging and retail display."
    ),
    segments: [
      {
        text: loc("We support the entire horticultural"),
        tone: "green",
        breakBefore: false,
      },
      {
        text: loc("supply chain: "),
        tone: "green",
        breakBefore: true,
      },
      {
        text: loc("from propagation"),
        tone: "white",
        breakBefore: false,
      },
      {
        text: loc("and planting to packaging and"),
        tone: "white",
        breakBefore: true,
      },
      {
        text: loc("retail display."),
        tone: "white",
        breakBefore: true,
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
        label: loc("Years of Industry Experience"),
      },
    ],
  },
  capabilities: {
    eyebrow: loc("Solutions"),
    title: loc(
      "We combine global capabilities, industry expertise, and integrated solutions to help growers and horticulture businesses operate more efficiently at every stage."
    ),
    ctaLabel: loc("Find the right solution"),
    ctaHref: "/solutions",
    items: [
      {
        id: "integrated",
        title: loc("Integrated Solutions"),
        description: loc(
          "From Production To Logistics, We Deliver End-To-End Horticulture Solutions Instead Of Standalone Products."
        ),
        image: "/assets/homepage/solutions-integrated.jpg",
        href: "/solutions",
      },
      {
        id: "global",
        title: loc("Global Reach, Local Expertise"),
        description: loc(
          "Worldwide Manufacturing Backed By Localized Production, Support, And Deep Horticulture Knowledge."
        ),
        image: "/assets/homepage/solutions-global.jpg",
        href: "/solutions",
      },
      {
        id: "integrated-2",
        title: loc("Integrated Solutions"),
        description: loc(
          "From Production To Logistics, We Deliver End-To-End Horticulture Solutions Instead Of Standalone Products."
        ),
        image: "/assets/homepage/solutions-logistics.jpg",
        href: "/solutions",
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
    eyebrow: loc("Featured Categories"),
    title: loc(
      "At OBOYA, we go beyond supplying products, we deliver integrated horticulture solutions designed to improve efficiency, optimize operations, and support long-term growth across the global supply chain."
    ),
    ctaLabel: loc("See all products"),
    ctaHref: "/shop",
    items: [
      {
        id: "feat-packaging",
        categoryId: "packaging",
        title: loc("Packaging"),
        description: loc(
          "Retail and bulk packaging solutions that protect freshness from harvest to shelf."
        ),
        image:
          "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: "feat-propagation",
        categoryId: "propagation",
        title: loc("Propagation"),
        description: loc(
          "Trays, seedling systems, and tools for consistent young-plant production."
        ),
        image:
          "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: "feat-equipment",
        categoryId: "equipment",
        title: loc("Logistics & Display"),
        description: loc(
          "Trolleys, carts, and display equipment for efficient handling and retail presentation."
        ),
        image:
          "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=800&auto=format&fit=crop",
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
    title: loc("Certified by the best in the industry"),
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
const CONTENT_REVISION = "home-featured-categories-v1-2026-07-14";
let appliedRevision: string | null = null;

function migrateSettings(settings: HomepageSettings): HomepageSettings {
  const defaults = defaultSettings();
  return {
    ...defaults,
    ...settings,
    hero: {
      ...defaults.hero,
      ...settings.hero,
      pills: settings.hero?.pills?.length
        ? settings.hero.pills.map((pill, i) => ({
            ...defaults.hero.pills[i],
            ...pill,
            image: pill.image ?? defaults.hero.pills[i]?.image,
          }))
        : defaults.hero.pills,
    },
    companyOverview: {
      ...defaults.companyOverview,
      ...settings.companyOverview,
      segments:
        settings.companyOverview?.segments?.length > 0
          ? settings.companyOverview.segments
          : defaults.companyOverview.segments,
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
    globalPresence: { ...defaults.globalPresence, ...settings.globalPresence },
    testimonials: { ...defaults.testimonials, ...settings.testimonials },
    featuredProducts: {
      ...defaults.featuredProducts,
      ...settings.featuredProducts,
      items: (() => {
        const raw = settings.featuredProducts?.items;
        const looksLikeProducts =
          Array.isArray(raw) &&
          raw.some(
            (item) =>
              item != null &&
              "productId" in item &&
              !("categoryId" in item && (item as HomepageFeaturedCategory).categoryId)
          );
        if (!raw?.length || looksLikeProducts) {
          return defaults.featuredProducts.items;
        }
        return raw.map((item, i) => ({
          ...defaults.featuredProducts.items[i],
          ...item,
          categoryId:
            (item as HomepageFeaturedCategory).categoryId ??
            defaults.featuredProducts.items[i]?.categoryId,
        }));
      })(),
    },
    latestNews: { ...defaults.latestNews, ...settings.latestNews },
    partners: { ...defaults.partners, ...settings.partners },
    sections: { ...defaults.sections, ...settings.sections },
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

export function saveHomepageSettings(settings: HomepageSettings): HomepageSettings {
  const updated = migrateSettings({
    ...settings,
    updatedAt: new Date().toISOString(),
  });
  cache = updated;
  appliedRevision = CONTENT_REVISION;
  return updated;
}

/** Reset in-memory CMS to homepage defaults. */
export function resetHomepageSettings(): HomepageSettings {
  cache = defaultSettings();
  appliedRevision = CONTENT_REVISION;
  return cache;
}
