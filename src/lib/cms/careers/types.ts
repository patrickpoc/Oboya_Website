import type { LocalizedString } from "@/lib/cms/types";

/** Constants mirror the CHECK constraints in supabase/migrations/20261020_cms_careers.sql. */
export const WORK_MODELS = ["onsite", "hybrid", "remote"] as const;
export const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "temporary",
  "internship",
  "apprenticeship",
] as const;
export const SENIORITIES = [
  "intern",
  "junior",
  "mid",
  "senior",
  "lead",
  "manager",
  "director",
  "executive",
] as const;
export const SALARY_PERIODS = ["hour", "month", "year"] as const;
export const OPENING_STATUSES = ["draft", "published", "closed", "archived"] as const;
export const PIPELINE_STATUSES = [
  "new",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
] as const;
export const WORK_AUTHORIZATIONS = [
  "citizen",
  "permanent_resident",
  "work_visa",
  "needs_sponsorship",
  "other",
] as const;
export const APPLICATION_SOURCES = [
  "website",
  "linkedin",
  "referral",
  "job_board",
  "agency",
  "event",
  "manual",
  "other",
] as const;
export const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "native"] as const;
export const ACTIVITY_KINDS = [
  "created",
  "note",
  "status_change",
  "rating",
  "cv_uploaded",
  "cv_removed",
  "updated",
  "anonymized",
] as const;

export type WorkModel = (typeof WORK_MODELS)[number];
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type Seniority = (typeof SENIORITIES)[number];
export type SalaryPeriod = (typeof SALARY_PERIODS)[number];
export type OpeningStatus = (typeof OPENING_STATUSES)[number];
export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];
export type WorkAuthorization = (typeof WORK_AUTHORIZATIONS)[number];
export type ApplicationSource = (typeof APPLICATION_SOURCES)[number];
export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const OPENING_LOCALIZED_FIELDS = [
  "title",
  "summary",
  "description",
  "responsibilities",
  "requirements",
  "niceToHave",
  "benefits",
] as const;
export type OpeningLocalizedField = (typeof OPENING_LOCALIZED_FIELDS)[number];

export interface JobOpening {
  id: string;
  slug: string;
  title: LocalizedString;
  summary: LocalizedString;
  description: LocalizedString;
  responsibilities: LocalizedString;
  requirements: LocalizedString;
  niceToHave: LocalizedString;
  benefits: LocalizedString;
  department?: string;
  countryCode?: string;
  city?: string;
  workModel?: WorkModel;
  employmentType?: EmploymentType;
  seniority?: Seniority;
  positions: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: SalaryPeriod;
  showSalary: boolean;
  status: OpeningStatus;
  publishAt?: string;
  closeAt?: string;
  publishedAt?: string;
  closedAt?: string;
  hiringManagerId?: string;
  hiringManagerName?: string;
  recruiterId?: string;
  recruiterName?: string;
  seo?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/** Opening plus per-status application counts (from cms_job_opening_stats). */
export interface JobOpeningWithStats extends JobOpening {
  stats?: PipelineCounts & { lastAppliedAt?: string };
}

export type PipelineCounts = { total: number } & Record<PipelineStatus, number>;

export interface LanguageSkill {
  code: string;
  level: LanguageLevel;
}

export interface JobApplication {
  id: string;
  openingId: string | null;
  fullName: string;
  email: string;
  phone?: string;
  countryCode?: string;
  city?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  currentCompany?: string;
  currentTitle?: string;
  yearsExperience?: number;
  salaryExpectation?: number;
  salaryCurrency?: string;
  salaryPeriod?: SalaryPeriod;
  availabilityDate?: string;
  noticePeriodDays?: number;
  workAuthorization?: WorkAuthorization;
  willingToRelocate?: boolean;
  remotePreference?: WorkModel;
  languages: LanguageSkill[];
  coverLetter?: string;
  source?: ApplicationSource;
  sourceDetail?: string;
  referrerName?: string;
  locale?: string;
  consentPrivacy: boolean;
  consentPrivacyAt?: string;
  consentVersion?: string;
  consentTalentPool: boolean;
  cvPath?: string;
  cvFilename?: string;
  cvMime?: string;
  cvSize?: number;
  status: PipelineStatus;
  rating?: number;
  tags: string[];
  assigneeId?: string;
  assigneeName?: string;
  rejectionReason?: string;
  readAt?: string;
  lastActivityAt?: string;
  anonymizedAt?: string;
  extra?: Record<string, unknown>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplicationActivity {
  id: string;
  applicationId: string;
  kind: ActivityKind;
  body?: string;
  meta?: Record<string, unknown>;
  actorId?: string;
  actorName?: string;
  createdAt: string;
}

export interface OpeningFilters {
  q?: string;
  status?: OpeningStatus | "active" | "all";
  department?: string;
  countryCode?: string;
  workModel?: WorkModel;
}

export interface ApplicationFilters {
  q?: string;
  openingId?: string | "talent_pool";
  status?: PipelineStatus;
  source?: ApplicationSource;
}
