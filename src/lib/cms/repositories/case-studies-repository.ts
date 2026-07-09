import type { CmsStatus, LocalizedString, SeoFields } from "@/lib/cms/types";
import { caseStudies } from "@/constants/content-data";

export interface CmsCaseStudy {
  id: string;
  slug: string;
  title: LocalizedString;
  challenge: LocalizedString;
  solution: LocalizedString;
  results: LocalizedString;
  industry: string;
  country: string;
  segment: string;
  images: string[];
  gallery: string[];
  downloads: { title: string; url: string }[];
  status: CmsStatus;
  seo: SeoFields;
  createdAt: string;
  updatedAt: string;
}

const emptyLoc = (): LocalizedString => ({ en: "", "pt-BR": "", es: "", "zh-CN": "" });

function seed(): CmsCaseStudy[] {
  return caseStudies.map((c) => ({
    id: c.slug,
    slug: c.slug,
    title: {
      en: c.slug.replace(/-/g, " "),
      "pt-BR": c.slug.replace(/-/g, " "),
      es: c.slug.replace(/-/g, " "),
      "zh-CN": c.slug.replace(/-/g, " "),
    },
    challenge: emptyLoc(),
    solution: emptyLoc(),
    results: emptyLoc(),
    industry: c.industry,
    country: c.country,
    segment: c.industry,
    images: [],
    gallery: [],
    downloads: [],
    status: "published" as CmsStatus,
    seo: { title: emptyLoc(), description: emptyLoc() },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }));
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
