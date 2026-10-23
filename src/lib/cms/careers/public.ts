import type { LocalizedString } from "@/lib/cms/types";
import { pickLocalized } from "@/lib/cms/utils";
import type {
  EmploymentType,
  JobOpening,
  Seniority,
  SalaryPeriod,
  WorkModel,
} from "./types";

/** Client-safe: no server-only imports. Rich HTML sanitizing is injected by the caller. */
export interface PublicJobOpening {
  slug: string;
  title: string;
  summary: string;
  descriptionHtml: string;
  responsibilitiesHtml: string;
  requirementsHtml: string;
  niceToHaveHtml: string;
  benefitsHtml: string;
  department?: string;
  countryCode?: string;
  city?: string;
  workModel?: WorkModel;
  employmentType?: EmploymentType;
  seniority?: Seniority;
  positions: number;
  salary?: { min?: number; max?: number; currency: string; period: SalaryPeriod };
  postedAt: string;
  closeAt?: string;
  updatedAt: string;
}

export interface PublicOpeningFilters {
  country?: string;
  q?: string;
  department?: string;
  workModel?: string;
  type?: string;
}

function time(value: string): number {
  return new Date(value).getTime();
}

/** publish_at is an embargo on a published row; it never publishes a draft. */
export function isOpeningPublic(
  o: Pick<JobOpening, "status" | "publishAt" | "closeAt">,
  now: Date = new Date()
): boolean {
  if (o.status !== "published") return false;
  const t = now.getTime();
  if (o.publishAt && time(o.publishAt) > t) return false;
  if (o.closeAt && time(o.closeAt) <= t) return false;
  return true;
}

export function toPublicOpening(
  o: JobOpening,
  locale: string,
  sanitizeHtml: (html: string) => string
): PublicJobOpening {
  const text = (v: LocalizedString) => pickLocalized(v, locale);
  const html = (v: LocalizedString) => sanitizeHtml(text(v));
  const hasSalary =
    o.showSalary && (o.salaryMin !== undefined || o.salaryMax !== undefined) && !!o.salaryCurrency;
  return {
    slug: o.slug,
    title: text(o.title),
    summary: text(o.summary),
    descriptionHtml: html(o.description),
    responsibilitiesHtml: html(o.responsibilities),
    requirementsHtml: html(o.requirements),
    niceToHaveHtml: html(o.niceToHave),
    benefitsHtml: html(o.benefits),
    department: o.department,
    countryCode: o.countryCode,
    city: o.city,
    workModel: o.workModel,
    employmentType: o.employmentType,
    seniority: o.seniority,
    positions: o.positions,
    ...(hasSalary
      ? {
          salary: {
            min: o.salaryMin,
            max: o.salaryMax,
            currency: o.salaryCurrency as string,
            period: o.salaryPeriod ?? "month",
          },
        }
      : {}),
    postedAt: o.publishedAt ?? o.createdAt,
    closeAt: o.closeAt,
    updatedAt: o.updatedAt,
  };
}

function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

export function filterPublicOpenings(
  list: PublicJobOpening[],
  f: PublicOpeningFilters
): PublicJobOpening[] {
  const q = f.q ? fold(f.q) : "";
  const country = f.country?.toUpperCase();
  return list.filter((o) => {
    if (country && o.countryCode !== country) return false;
    if (f.department && o.department !== f.department) return false;
    if (f.workModel && o.workModel !== f.workModel) return false;
    if (f.type && o.employmentType !== f.type) return false;
    if (q) {
      const haystack = fold([o.title, o.summary, o.department, o.city].filter(Boolean).join(" "));
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/** Sorted by country code; the UI re-sorts by localized name. */
export function countryFacets(list: PublicJobOpening[]): { code: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const o of list) if (o.countryCode) counts.set(o.countryCode, (counts.get(o.countryCode) ?? 0) + 1);
  return [...counts].map(([code, count]) => ({ code, count })).sort((a, b) => a.code.localeCompare(b.code));
}

export function departmentFacets(list: PublicJobOpening[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const o of list) if (o.department) counts.set(o.department, (counts.get(o.department) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
}

const JSON_LD_EMPLOYMENT: Record<EmploymentType, string> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  contract: "CONTRACTOR",
  temporary: "TEMPORARY",
  internship: "INTERN",
  apprenticeship: "OTHER",
};
const JSON_LD_PERIOD: Record<SalaryPeriod, string> = { hour: "HOUR", month: "MONTH", year: "YEAR" };

export interface JobPostingOrg {
  url: string;
  orgName: string;
  orgUrl: string;
  logoUrl?: string;
}

/** Returns a plain object; the caller serializes and escapes `<` (JSON.stringify(...).replace(/</g, "\\u003c")). */
export function buildJobPostingJsonLd(
  dto: PublicJobOpening,
  org: JobPostingOrg,
  /** English country name, or a resolver from ISO code (falls back to the code). */
  countryName?: string | ((code: string) => string | undefined)
): Record<string, unknown> {
  const description = [dto.descriptionHtml, dto.responsibilitiesHtml, dto.requirementsHtml]
    .filter(Boolean)
    .join("\n");
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: dto.title,
    description: description || dto.summary,
    datePosted: dto.postedAt,
    url: org.url,
    identifier: { "@type": "PropertyValue", name: org.orgName, value: dto.slug },
    directApply: true,
    hiringOrganization: {
      "@type": "Organization",
      name: org.orgName,
      sameAs: org.orgUrl,
      ...(org.logoUrl ? { logo: org.logoUrl } : {}),
    },
  };
  if (dto.closeAt) ld.validThrough = dto.closeAt;
  if (dto.employmentType) ld.employmentType = JSON_LD_EMPLOYMENT[dto.employmentType];
  if (dto.countryCode) {
    ld.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(dto.city ? { addressLocality: dto.city } : {}),
        addressCountry: dto.countryCode,
      },
    };
    if (dto.workModel === "remote") {
      const name = (typeof countryName === "function" ? countryName(dto.countryCode) : countryName) || dto.countryCode;
      ld.jobLocationType = "TELECOMMUTE";
      ld.applicantLocationRequirements = { "@type": "Country", name };
    }
  }
  if (dto.salary) {
    ld.baseSalary = {
      "@type": "MonetaryAmount",
      currency: dto.salary.currency,
      value: {
        "@type": "QuantitativeValue",
        ...(dto.salary.min !== undefined ? { minValue: dto.salary.min } : {}),
        ...(dto.salary.max !== undefined ? { maxValue: dto.salary.max } : {}),
        unitText: JSON_LD_PERIOD[dto.salary.period],
      },
    };
  }
  return ld;
}
