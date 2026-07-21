import type { CmsStatus, LocalizedString, SeoFields } from "@/lib/cms/types";
import { caseStudies } from "@/constants/content-data";

export type CaseStudyRegion = "europe" | "americas" | "asia" | "other";

export interface CmsCaseStudy {
  id: string;
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  /** Short outcome metric shown on cards, e.g. "−18% handling time" */
  metric: LocalizedString;
  challenge: LocalizedString;
  solution: LocalizedString;
  results: LocalizedString;
  industry: string;
  country: string;
  region: CaseStudyRegion;
  segment: string;
  coverImage: string;
  images: string[];
  gallery: string[];
  downloads: { title: string; url: string }[];
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

const seedContent: Record<
  string,
  {
    title: LocalizedString;
    excerpt: LocalizedString;
    metric: LocalizedString;
    challenge: LocalizedString;
    solution: LocalizedString;
    results: LocalizedString;
    coverImage: string;
    region: CaseStudyRegion;
  }
> = {
  case1: {
    title: loc("Scaling greenhouse logistics in the Netherlands"),
    excerpt: loc(
      "A commercial greenhouse group needed consistent tray and trolley flows across sites."
    ),
    metric: loc("−18% handling time"),
    challenge: loc(
      "Inconsistent logistics hardware slowed transplanting and dispatch cycles."
    ),
    solution: loc(
      "Oboya standardized trolley formats and propagation trays across three facilities."
    ),
    results: loc(
      "Handling time dropped 18% and dispatch accuracy improved across peak season."
    ),
    coverImage:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1400&h=900&q=75",
    region: "europe",
  },
  case2: {
    title: loc("Berry packaging program in Brazil"),
    excerpt: loc(
      "A berry exporter required retail-ready packs for multiple supermarket chains."
    ),
    metric: loc("−22% waste claims"),
    challenge: loc(
      "Existing packs failed shelf-life targets for export programs."
    ),
    solution: loc(
      "Custom clamshell formats and palletization support were deployed with local partners."
    ),
    results: loc(
      "Waste claims fell 22% while maintaining premium shelf presentation."
    ),
    coverImage:
      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1400&h=900&q=75",
    region: "americas",
  },
  case3: {
    title: loc("Distribution hub modernization in Mexico"),
    excerpt: loc(
      "A regional distributor needed faster replenishment for greenhouse clients."
    ),
    metric: loc("11 → 6 day lead time"),
    challenge: loc(
      "Fragmented inventory and long lead times affected grower planning."
    ),
    solution: loc(
      "Oboya implemented a hub-and-spoke model with localized SKU assortments."
    ),
    results: loc(
      "Average replenishment lead time improved from 11 to 6 days."
    ),
    coverImage:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1400&h=900&q=75",
    region: "americas",
  },
  case4: {
    title: loc("Growing media supply in China"),
    excerpt: loc(
      "A propagation network sought consistent substrate performance at scale."
    ),
    metric: loc("Lower rework rates"),
    challenge: loc(
      "Variable media quality created uneven rooting and higher scrap."
    ),
    solution: loc(
      "Premium growing media blends were qualified and supplied through regional partners."
    ),
    results: loc(
      "Rooting consistency improved and rework rates declined across propagation lines."
    ),
    coverImage:
      "https://images.unsplash.com/photo-1466692476867-a0881dfc0648?auto=format&fit=crop&w=1400&h=900&q=75",
    region: "asia",
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
      results: copy?.results ?? emptyLoc(),
      industry: c.industry,
      country: c.country,
      region: copy?.region ?? "other",
      segment: c.industry,
      coverImage: copy?.coverImage ?? "",
      images: [],
      gallery: [],
      downloads: [],
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

export function deleteCaseStudy(id: string): boolean {
  const items = getCaseStudies();
  const idx = items.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  items.splice(idx, 1);
  cache = items;
  return true;
}
