import { LANGUAGE_LEVELS, WORK_AUTHORIZATIONS, WORK_MODELS, type JobApplication } from "./types";
import { normalizeApplication, validateApplication, validateCvFile } from "./validation";

/** Client-safe: pure parsing of the anonymous application payload. */
export const PUBLIC_APPLY_LIMITS = {
  bodyBytes: 32 * 1024,
  coverLetterChars: 5000,
  minFillMs: 3000,
  ticketTtlMs: 2 * 60 * 60 * 1000,
} as const;

export const HEARD_FROM_OPTIONS = [
  "linkedin",
  "job_board",
  "referral",
  "event",
  "search",
  "social",
  "other",
] as const;

const LOCALES = ["en", "pt-BR", "es", "zh-CN"];

export interface PublicApplicationValue {
  openingSlug: string | null;
  /** Normalized; pipeline fields are forced to defaults, openingId is null (the server resolves it). */
  application: JobApplication;
  cv: { name: string; mime: string; size: number };
  startedAt: number;
  locale: string;
}

export type PublicApplicationResult =
  | { ok: true; value: PublicApplicationValue }
  | { ok: false; errors: string[] };

type Raw = Record<string, unknown>;

function asRaw(input: unknown): Raw {
  return input && typeof input === "object" ? (input as Raw) : {};
}

/** Honeypot filled or form submitted faster than a human could. */
export function looksLikeBot(input: unknown, now: number = Date.now()): boolean {
  const raw = asRaw(input);
  if (typeof raw.website === "string" && raw.website.trim() !== "") return true;
  const started = Number(raw.startedAt);
  return !Number.isFinite(started) || now - started < PUBLIC_APPLY_LIMITS.minFillMs;
}

const str = (v: unknown) => (typeof v === "string" ? v : undefined);

export function parsePublicApplication(input: unknown): PublicApplicationResult {
  const raw = asRaw(input);
  const cvRaw = asRaw(raw.cv);
  const errors: string[] = [];

  const heard = HEARD_FROM_OPTIONS.find((o) => o === raw.heardFrom);
  const locale = LOCALES.includes(raw.locale as string) ? (raw.locale as string) : "en";
  const slug = str(raw.openingSlug)?.trim().slice(0, 160);

  // Explicit allowlist: nothing else from the client reaches normalizeApplication.
  const application = normalizeApplication({
    fullName: raw.fullName,
    email: raw.email,
    phone: raw.phone,
    countryCode: raw.countryCode,
    city: raw.city,
    linkedinUrl: raw.linkedinUrl,
    portfolioUrl: raw.portfolioUrl,
    currentCompany: raw.currentCompany,
    currentTitle: raw.currentTitle,
    yearsExperience: raw.yearsExperience,
    salaryExpectation: raw.salaryExpectation,
    salaryCurrency: raw.salaryCurrency,
    salaryPeriod: raw.salaryPeriod,
    availabilityDate: raw.availabilityDate,
    noticePeriodDays: raw.noticePeriodDays,
    workAuthorization: WORK_AUTHORIZATIONS.find((v) => v === raw.workAuthorization),
    willingToRelocate: raw.willingToRelocate,
    remotePreference: WORK_MODELS.find((v) => v === raw.remotePreference),
    languages: Array.isArray(raw.languages)
      ? raw.languages.filter((l) => LANGUAGE_LEVELS.includes(asRaw(l).level as never))
      : [],
    coverLetter: raw.coverLetter,
    referrerName: raw.referrerName,
    consentPrivacy: raw.consentPrivacy,
    consentTalentPool: raw.consentTalentPool,
    // forced values
    openingId: null,
    source: "website",
    sourceDetail: heard,
    locale,
    status: "new",
    tags: [],
    extra: {},
  });

  const validated = validateApplication(application);
  if (!validated.ok) errors.push(...validated.errors);
  if (!application.phone) errors.push("phoneRequired");
  if (!application.countryCode) errors.push("countryRequired");
  if ((str(raw.coverLetter)?.trim().length ?? 0) > PUBLIC_APPLY_LIMITS.coverLetterChars) {
    errors.push("coverLetterTooLong");
  }

  const cv = {
    name: (str(cvRaw.name) ?? "").trim().slice(0, 255),
    mime: str(cvRaw.mime) ?? "",
    size: Number(cvRaw.size),
  };
  if (!cv.name || !cv.mime || !Number.isFinite(cv.size)) {
    errors.push("cvRequired");
  } else {
    const file = validateCvFile(cv.mime, cv.size);
    if (!file.ok) errors.push(...file.errors.map((e) => (e === "invalidType" ? "cvType" : "cvTooLarge")));
  }

  if (errors.length) return { ok: false, errors: [...new Set(errors)] };
  return {
    ok: true,
    value: {
      openingSlug: slug || null,
      application,
      cv,
      startedAt: Number(raw.startedAt) || 0,
      locale,
    },
  };
}
