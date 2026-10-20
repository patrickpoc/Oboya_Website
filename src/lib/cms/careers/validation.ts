import { slugify } from "@/lib/cms/slugify";
import type { LocalizedString } from "@/lib/cms/types";
import {
  APPLICATION_SOURCES,
  EMPLOYMENT_TYPES,
  LANGUAGE_LEVELS,
  OPENING_LOCALIZED_FIELDS,
  OPENING_STATUSES,
  PIPELINE_STATUSES,
  SALARY_PERIODS,
  SENIORITIES,
  WORK_AUTHORIZATIONS,
  WORK_MODELS,
  type JobApplication,
  type JobOpening,
  type LanguageSkill,
} from "./types";

export const CV_MAX_BYTES = 10 * 1024 * 1024;
export const CV_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const CV_EXT_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

function result(errors: string[]): ValidationResult {
  return errors.length ? { ok: false, errors } : { ok: true };
}

function pick<T extends string>(list: readonly T[], raw: unknown): T | undefined {
  return list.includes(raw as T) ? (raw as T) : undefined;
}

function text(raw: unknown, max = 500): string | undefined {
  const value = typeof raw === "string" ? raw.trim().slice(0, max) : "";
  return value || undefined;
}

function num(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function iso(raw: unknown): string | undefined {
  const value = text(raw, 40);
  if (!value) return undefined;
  return Number.isNaN(new Date(value).getTime()) ? undefined : value;
}

function code(raw: unknown, length: number): string | undefined {
  const value = text(raw, length)?.toUpperCase();
  return value && value.length === length ? value : undefined;
}

export function normalizeLocalized(raw: unknown): LocalizedString {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const get = (key: string) => (typeof source[key] === "string" ? (source[key] as string) : "");
  return { en: get("en"), "pt-BR": get("pt-BR"), es: get("es"), "zh-CN": get("zh-CN") };
}

/** Only title/description (capped) and noindex survive; anything else is dropped. */
function normalizeSeo(raw: unknown): Record<string, unknown> {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const cap = (value: unknown, max: number) => {
    const l = normalizeLocalized(value);
    return Object.fromEntries(Object.entries(l).map(([k, v]) => [k, v.slice(0, max)]));
  };
  return { title: cap(r.title, 120), description: cap(r.description, 320), noindex: r.noindex === true };
}

export function normalizeOpening(raw: unknown): JobOpening {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const now = new Date().toISOString();
  const title = normalizeLocalized(r.title);
  const localized = Object.fromEntries(
    OPENING_LOCALIZED_FIELDS.map((key) => [key, normalizeLocalized(r[key])])
  ) as Pick<JobOpening, (typeof OPENING_LOCALIZED_FIELDS)[number]>;
  const positions = Math.trunc(num(r.positions) ?? 1);
  return {
    id: text(r.id, 80) ?? "",
    slug: slugify(text(r.slug, 160) ?? title.en),
    ...localized,
    department: text(r.department, 120),
    countryCode: code(r.countryCode, 2),
    city: text(r.city, 120),
    workModel: pick(WORK_MODELS, r.workModel),
    employmentType: pick(EMPLOYMENT_TYPES, r.employmentType),
    seniority: pick(SENIORITIES, r.seniority),
    positions,
    salaryMin: num(r.salaryMin),
    salaryMax: num(r.salaryMax),
    salaryCurrency: code(r.salaryCurrency, 3),
    salaryPeriod: pick(SALARY_PERIODS, r.salaryPeriod),
    showSalary: r.showSalary === true,
    status: pick(OPENING_STATUSES, r.status) ?? "draft",
    publishAt: iso(r.publishAt),
    closeAt: iso(r.closeAt),
    publishedAt: iso(r.publishedAt),
    closedAt: iso(r.closedAt),
    hiringManagerId: text(r.hiringManagerId, 80),
    hiringManagerName: text(r.hiringManagerName, 160),
    recruiterId: text(r.recruiterId, 80),
    recruiterName: text(r.recruiterName, 160),
    seo: normalizeSeo(r.seo),
    createdBy: text(r.createdBy, 80),
    updatedBy: text(r.updatedBy, 80),
    createdAt: iso(r.createdAt) ?? now,
    updatedAt: iso(r.updatedAt) ?? now,
  };
}

/** Error strings are stable codes the UI maps to admin.careers.* messages. */
export function validateOpening(opening: JobOpening): ValidationResult {
  const errors: string[] = [];
  if (!opening.title.en.trim()) errors.push("titleRequired");
  if (!opening.slug) errors.push("slugRequired");
  if (!Number.isInteger(opening.positions) || opening.positions < 1) errors.push("positionsMin");
  const { salaryMin: min, salaryMax: max } = opening;
  if ((min !== undefined && min < 0) || (max !== undefined && max < 0)) errors.push("salaryNegative");
  if (min !== undefined && max !== undefined && max < min) errors.push("salaryRange");
  if (opening.publishAt && opening.closeAt) {
    if (new Date(opening.closeAt).getTime() <= new Date(opening.publishAt).getTime()) {
      errors.push("closeBeforePublish");
    }
  }
  return result(errors);
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeLanguages(raw: unknown): LanguageSkill[] {
  if (!Array.isArray(raw)) return [];
  const out: LanguageSkill[] = [];
  for (const item of raw) {
    const entry = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const lang = text(entry.code, 10)?.toLowerCase();
    const level = pick(LANGUAGE_LEVELS, entry.level);
    if (lang && level) out.push({ code: lang, level });
  }
  return out.slice(0, 10);
}

function normalizeTagList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  for (const tag of raw) {
    const value = String(tag ?? "").trim().toLowerCase().slice(0, 40);
    if (value) seen.add(value);
  }
  return [...seen].slice(0, 20);
}

export function normalizeApplication(raw: unknown): JobApplication {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const now = new Date().toISOString();
  const rating = num(r.rating);
  return {
    id: text(r.id, 80) ?? "",
    openingId: text(r.openingId, 80) ?? null,
    fullName: text(r.fullName, 200) ?? "",
    email: text(r.email, 254)?.toLowerCase() ?? "",
    phone: text(r.phone, 40),
    countryCode: code(r.countryCode, 2),
    city: text(r.city, 120),
    linkedinUrl: text(r.linkedinUrl, 500),
    portfolioUrl: text(r.portfolioUrl, 500),
    currentCompany: text(r.currentCompany, 160),
    currentTitle: text(r.currentTitle, 160),
    yearsExperience: num(r.yearsExperience),
    salaryExpectation: num(r.salaryExpectation),
    salaryCurrency: code(r.salaryCurrency, 3),
    salaryPeriod: pick(SALARY_PERIODS, r.salaryPeriod),
    availabilityDate: text(r.availabilityDate, 10),
    noticePeriodDays: num(r.noticePeriodDays),
    workAuthorization: pick(WORK_AUTHORIZATIONS, r.workAuthorization),
    willingToRelocate: typeof r.willingToRelocate === "boolean" ? r.willingToRelocate : undefined,
    remotePreference: pick(WORK_MODELS, r.remotePreference),
    languages: normalizeLanguages(r.languages),
    coverLetter: text(r.coverLetter, 10000),
    source: pick(APPLICATION_SOURCES, r.source),
    sourceDetail: text(r.sourceDetail, 200),
    referrerName: text(r.referrerName, 160),
    locale: text(r.locale, 10),
    consentPrivacy: r.consentPrivacy === true,
    consentPrivacyAt: iso(r.consentPrivacyAt),
    consentVersion: text(r.consentVersion, 40),
    consentTalentPool: r.consentTalentPool === true,
    cvPath: text(r.cvPath, 300),
    cvFilename: text(r.cvFilename, 255),
    cvMime: text(r.cvMime, 150),
    cvSize: num(r.cvSize),
    status: pick(PIPELINE_STATUSES, r.status) ?? "new",
    rating: rating !== undefined && Number.isInteger(rating) ? rating : undefined,
    tags: normalizeTagList(r.tags),
    assigneeId: text(r.assigneeId, 80),
    assigneeName: text(r.assigneeName, 160),
    rejectionReason: text(r.rejectionReason, 1000),
    readAt: iso(r.readAt),
    lastActivityAt: iso(r.lastActivityAt),
    anonymizedAt: iso(r.anonymizedAt),
    extra: r.extra && typeof r.extra === "object" ? (r.extra as Record<string, unknown>) : {},
    createdBy: text(r.createdBy, 80),
    createdAt: iso(r.createdAt) ?? now,
    updatedAt: iso(r.updatedAt) ?? now,
  };
}

export function validateApplication(app: JobApplication): ValidationResult {
  const errors: string[] = [];
  if (!app.fullName.trim()) errors.push("nameRequired");
  if (!isValidEmail(app.email)) errors.push("emailInvalid");
  if (!app.consentPrivacy) errors.push("consentRequired");
  for (const url of [app.linkedinUrl, app.portfolioUrl]) {
    if (url && !isValidHttpUrl(url)) {
      errors.push("urlInvalid");
      break;
    }
  }
  if (app.yearsExperience !== undefined && (app.yearsExperience < 0 || app.yearsExperience > 70)) {
    errors.push("yearsRange");
  }
  if (app.rating !== undefined && (app.rating < 1 || app.rating > 5)) errors.push("ratingRange");
  if (app.noticePeriodDays !== undefined && (!Number.isInteger(app.noticePeriodDays) || app.noticePeriodDays < 0)) {
    errors.push("noticeRange");
  }
  if (app.openingId && !UUID_PATTERN.test(app.openingId)) errors.push("openingInvalid");
  if (app.availabilityDate && !isValidIsoDate(app.availabilityDate)) errors.push("dateInvalid");
  if (app.salaryExpectation !== undefined && app.salaryExpectation < 0) errors.push("salaryNegative");
  return result(errors);
}

export function validateCvFile(mime: string, size: number): ValidationResult {
  const errors: string[] = [];
  if (!(CV_MIME_TYPES as readonly string[]).includes(mime)) errors.push("invalidType");
  if (!Number.isFinite(size) || size <= 0 || size > CV_MAX_BYTES) errors.push("tooLarge");
  return result(errors);
}

export function cvExtensionForMime(mime: string): string | undefined {
  return CV_EXT_BY_MIME[mime];
}

const CV_PATH_RE =
  /^applications\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/cv-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|doc|docx)$/;

/** Object path must be applications/<applicationId>/cv-<uuid>.<ext>; pass applicationId to bind it. */
export function isValidCvObjectPath(path: string, applicationId?: string): boolean {
  const match = CV_PATH_RE.exec(path);
  if (!match) return false;
  return applicationId === undefined || match[1] === applicationId.toLowerCase();
}
