import type { CmsStatus, LocalizedString, SeoFields } from "@/lib/cms/types";
import { caseStudies } from "@/constants/content-data";

export type CaseStudyRegion = "europe" | "americas" | "asia" | "other";

export interface CmsCaseStudyTestimonial {
  quote: LocalizedString;
  author: string;
  company: string;
}

export interface CmsCaseStudy {
  id: string;
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  /** Short outcome metric shown on cards, e.g. "−18% handling time" */
  metric: LocalizedString;
  challenge: LocalizedString;
  solution: LocalizedString;
  implementation: LocalizedString;
  results: LocalizedString;
  client: string;
  timeline: LocalizedString;
  industry: string;
  country: string;
  region: CaseStudyRegion;
  segment: string;
  coverImage: string;
  images: string[];
  gallery: string[];
  downloads: { title: string; url: string }[];
  testimonial: CmsCaseStudyTestimonial;
  status: CmsStatus;
  seo: SeoFields;
  createdAt: string;
  updatedAt: string;
}

const emptyLoc = (): LocalizedString => ({
  en: "",
  "pt-BR": "",
  es: "",
  "zh-CN": "",
});

const loc = (en: string): LocalizedString => ({
  en,
  "pt-BR": en,
  es: en,
  "zh-CN": en,
});

const emptyTestimonial = (): CmsCaseStudyTestimonial => ({
  quote: emptyLoc(),
  author: "",
  company: "",
});

type SeedEntry = {
  title: LocalizedString;
  excerpt: LocalizedString;
  metric: LocalizedString;
  challenge: LocalizedString;
  solution: LocalizedString;
  implementation: LocalizedString;
  results: LocalizedString;
  client: string;
  timeline: LocalizedString;
  coverImage: string;
  images: string[];
  region: CaseStudyRegion;
  testimonial: CmsCaseStudyTestimonial;
};

const seedContent: Record<string, SeedEntry> = {
  case1: {
    title: loc("Scaling greenhouse logistics in the Netherlands"),
    excerpt: loc(
      "A commercial greenhouse group needed consistent tray and trolley flows across sites to keep transplanting and dispatch cycles predictable through peak season."
    ),
    metric: loc("−18% handling time"),
    challenge: loc(
      "Inconsistent logistics hardware slowed transplanting and dispatch cycles across three facilities. Teams spent too much time adapting to mismatched tray and trolley formats."
    ),
    solution: loc(
      "Oboya standardized trolley formats and propagation trays across sites, aligning hardware with existing workflows and local handling standards."
    ),
    implementation: loc(
      "Rollout began with a pilot line, then expanded facility by facility with on-site training and SKU rationalization so crews could adopt the new system without disrupting harvest windows."
    ),
    results: loc(
      "Handling time dropped 18% and dispatch accuracy improved across peak season, freeing capacity for higher throughput."
    ),
    client: "Westland Growers Collective",
    timeline: loc("18 months"),
    coverImage:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1600&h=700&q=75",
    images: [
      "https://images.unsplash.com/photo-1466692476867-a0881dfc0648?auto=format&fit=crop&w=1000&h=1200&q=75",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1000&h=1200&q=75",
    ],
    region: "europe",
    testimonial: {
      quote: loc(
        "Standardizing trays and trolleys with Oboya removed daily friction from our transplanting lines. We finally have one system that works across every site."
      ),
      author: "Anna de Vries",
      company: "Westland Growers Collective",
    },
  },
  case2: {
    title: loc("Berry packaging program in Brazil"),
    excerpt: loc(
      "A berry exporter required retail-ready packs for multiple supermarket chains while protecting shelf life on long export routes."
    ),
    metric: loc("−22% waste claims"),
    challenge: loc(
      "Existing packs failed shelf-life targets for export programs and created inconsistent presentation across retail partners."
    ),
    solution: loc(
      "Custom clamshell formats and palletization support were deployed with local partners to match chain specifications and cold-chain realities."
    ),
    implementation: loc(
      "Pack formats were validated in trial shipments, then scaled through regional packing houses with shared tooling and quality checkpoints."
    ),
    results: loc(
      "Waste claims fell 22% while maintaining premium shelf presentation for key supermarket programs."
    ),
    client: "Serra Berry Exports",
    timeline: loc("12 months"),
    coverImage:
      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1600&h=700&q=75",
    images: [
      "/assets/homepage/asia-pacific-expansion.webp",
      "/assets/homepage/greenhouse-technology.webp",
    ],
    region: "americas",
    testimonial: {
      quote: loc(
        "The packaging program gave us confidence with retailers. Claims dropped and our fruit arrives looking the way it should."
      ),
      author: "Carlos Mendes",
      company: "Serra Berry Exports",
    },
  },
  case3: {
    title: loc("Distribution hub modernization in Mexico"),
    excerpt: loc(
      "A regional distributor needed faster replenishment for greenhouse clients without expanding warehouse footprint."
    ),
    metric: loc("11 → 6 day lead time"),
    challenge: loc(
      "Fragmented inventory and long lead times affected grower planning and created stockouts during peak demand."
    ),
    solution: loc(
      "Oboya implemented a hub-and-spoke model with localized SKU assortments tailored to greenhouse customers."
    ),
    implementation: loc(
      "Inventory policies, pick paths, and partner replenishment cadences were redesigned, then staged live over two seasons."
    ),
    results: loc(
      "Average replenishment lead time improved from 11 to 6 days across the core assortment."
    ),
    client: "Bajío Horticulture Supply",
    timeline: loc("2023–2024"),
    coverImage:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1600&h=700&q=75",
    images: [
      "/assets/homepage/greenhouse-technology.webp",
      "/assets/homepage/solutions-logistics.jpg",
    ],
    region: "americas",
    testimonial: {
      quote: loc(
        "Lead times that used to stretch past a week now land in days. Our growers plan with confidence again."
      ),
      author: "María López",
      company: "Bajío Horticulture Supply",
    },
  },
  case4: {
    title: loc("Growing media supply in China"),
    excerpt: loc(
      "A propagation network sought consistent substrate performance at scale across provinces."
    ),
    metric: loc("Lower rework rates"),
    challenge: loc(
      "Variable media quality created uneven rooting and higher scrap across nursery lines."
    ),
    solution: loc(
      "Premium growing media blends were qualified and supplied through regional partners with clear specs."
    ),
    implementation: loc(
      "Batch qualification, logistics routing, and nursery onboarding were coordinated so every site received consistent media."
    ),
    results: loc(
      "Rooting consistency improved and rework rates declined across propagation lines."
    ),
    client: "GreenRoot Nurseries",
    timeline: loc("24 months"),
    coverImage:
      "https://images.unsplash.com/photo-1466692476867-a0881dfc0648?auto=format&fit=crop&w=1600&h=700&q=75",
    images: [
      "/assets/homepage/greenhouse-technology.webp",
      "/assets/homepage/asia-pacific-expansion.webp",
    ],
    region: "asia",
    testimonial: {
      quote: loc(
        "Consistent media quality changed our rooting outcomes overnight. Rework is down and crews trust every batch."
      ),
      author: "Wei Chen",
      company: "GreenRoot Nurseries",
    },
  },
};

function seed(): CmsCaseStudy[] {
  return caseStudies.map((c) => {
    const copy = seedContent[c.messageKey];
    return {
      id: c.slug,
      slug: c.slug,
      title: copy?.title ?? loc(c.slug.replace(/-/g, " ")),
      excerpt: copy?.excerpt ?? emptyLoc(),
      metric: copy?.metric ?? emptyLoc(),
      challenge: copy?.challenge ?? emptyLoc(),
      solution: copy?.solution ?? emptyLoc(),
      implementation: copy?.implementation ?? emptyLoc(),
      results: copy?.results ?? emptyLoc(),
      client: copy?.client ?? "",
      timeline: copy?.timeline ?? emptyLoc(),
      industry: c.industry,
      country: c.country,
      region: copy?.region ?? "other",
      segment: c.industry,
      coverImage: copy?.coverImage ?? "",
      images: copy?.images ?? [],
      gallery: [],
      downloads: [],
      testimonial: copy?.testimonial ?? emptyTestimonial(),
      status: "published" as CmsStatus,
      seo: { title: emptyLoc(), description: emptyLoc() },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
  });
}

let cache: CmsCaseStudy[] | null = null;

export function getCaseStudies(): CmsCaseStudy[] {
  if (!cache) cache = seed();
  return cache;
}

export function getCaseStudyById(id: string): CmsCaseStudy | undefined {
  return getCaseStudies().find((c) => c.id === id);
}

export function saveCaseStudy(study: CmsCaseStudy): CmsCaseStudy {
  const items = getCaseStudies();
  const idx = items.findIndex((c) => c.id === study.id);
  const updated = { ...study, updatedAt: new Date().toISOString() };
  if (idx >= 0) items[idx] = updated;
  else items.push(updated);
  cache = items;
  return updated;
}

export function replaceCaseStudiesCache(studies: CmsCaseStudy[]) {
  cache = [...studies];
}

export function deleteCaseStudy(id: string): boolean {
  const items = getCaseStudies();
  const idx = items.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  items.splice(idx, 1);
  cache = items;
  return true;
}
