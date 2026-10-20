import "server-only";

import { randomUUID } from "node:crypto";
import path from "node:path";
import { matchesApplicationFilters } from "@/lib/cms/careers/filters";
import {
  DAY_MS,
  PENDING_CV_TTL_MS,
  RETENTION_DAYS,
  TALENT_POOL_RETENTION_DAYS,
  isExpiredPending,
  isRetentionExpired,
} from "@/lib/cms/careers/retention";
import { normalizeApplication, validateApplication } from "@/lib/cms/careers/validation";
import type {
  ActivityKind,
  ApplicationFilters,
  JobApplication,
  JobApplicationActivity,
} from "@/lib/cms/careers/types";
import { removeAllCvObjects, removeCvObject } from "@/lib/cms/server/careers-cv.server";
import {
  CareersError,
  UUID_RE,
  careersClient,
  orNull,
  readLocalJson,
  throwIfDbError,
  writeLocalJson,
} from "@/lib/cms/server/careers-core.server";

const FILE = path.join(process.cwd(), "data", "cms", "careers-applications.json");
const MAX_ROWS = 5000;

export type CareersActor = { id: string; name: string };
type Row = Record<string, unknown>;
type LocalFile = { applications: JobApplication[]; activities: JobApplicationActivity[] };

/** Fields a PATCH may change. CV, consent, ids and anonymization have dedicated paths. */
const PATCHABLE = [
  "openingId", "fullName", "email", "phone", "countryCode", "city", "linkedinUrl", "portfolioUrl",
  "currentCompany", "currentTitle", "yearsExperience", "salaryExpectation", "salaryCurrency", "salaryPeriod",
  "availabilityDate", "noticePeriodDays", "workAuthorization", "willingToRelocate", "remotePreference",
  "languages", "coverLetter", "source", "sourceDetail", "referrerName", "consentTalentPool",
  "status", "rating", "tags", "assigneeId", "assigneeName", "rejectionReason",
] as const;

function toRow(a: JobApplication): Row {
  return {
    id: a.id,
    opening_id: a.openingId,
    full_name: a.fullName,
    email: a.email,
    phone: orNull(a.phone),
    country_code: orNull(a.countryCode),
    city: orNull(a.city),
    linkedin_url: orNull(a.linkedinUrl),
    portfolio_url: orNull(a.portfolioUrl),
    current_company: orNull(a.currentCompany),
    current_title: orNull(a.currentTitle),
    years_experience: orNull(a.yearsExperience),
    salary_expectation: orNull(a.salaryExpectation),
    salary_currency: orNull(a.salaryCurrency),
    salary_period: orNull(a.salaryPeriod),
    availability_date: orNull(a.availabilityDate),
    notice_period_days: orNull(a.noticePeriodDays),
    work_authorization: orNull(a.workAuthorization),
    willing_to_relocate: a.willingToRelocate ?? null,
    remote_preference: orNull(a.remotePreference),
    languages: a.languages,
    cover_letter: orNull(a.coverLetter),
    source: orNull(a.source),
    source_detail: orNull(a.sourceDetail),
    referrer_name: orNull(a.referrerName),
    locale: orNull(a.locale),
    consent_privacy: a.consentPrivacy,
    consent_privacy_at: a.consentPrivacyAt ?? new Date().toISOString(),
    consent_version: orNull(a.consentVersion),
    consent_talent_pool: a.consentTalentPool,
    cv_path: orNull(a.cvPath),
    cv_filename: orNull(a.cvFilename),
    cv_mime: orNull(a.cvMime),
    cv_size: orNull(a.cvSize),
    status: a.status,
    rating: orNull(a.rating),
    tags: a.tags,
    assignee_id: orNull(a.assigneeId),
    assignee_name: orNull(a.assigneeName),
    rejection_reason: orNull(a.rejectionReason),
    read_at: orNull(a.readAt),
    last_activity_at: orNull(a.lastActivityAt),
    anonymized_at: orNull(a.anonymizedAt),
    extra: a.extra ?? {},
    created_by: orNull(a.createdBy),
  };
}

const n = (v: unknown) => (v === null || v === undefined ? undefined : v);

function fromRow(r: Row): JobApplication {
  return normalizeApplication({
    id: r.id,
    openingId: r.opening_id,
    fullName: r.full_name,
    email: r.email,
    phone: n(r.phone),
    countryCode: n(r.country_code),
    city: n(r.city),
    linkedinUrl: n(r.linkedin_url),
    portfolioUrl: n(r.portfolio_url),
    currentCompany: n(r.current_company),
    currentTitle: n(r.current_title),
    yearsExperience: n(r.years_experience),
    salaryExpectation: n(r.salary_expectation),
    salaryCurrency: n(r.salary_currency),
    salaryPeriod: n(r.salary_period),
    availabilityDate: n(r.availability_date),
    noticePeriodDays: n(r.notice_period_days),
    workAuthorization: n(r.work_authorization),
    willingToRelocate: n(r.willing_to_relocate),
    remotePreference: n(r.remote_preference),
    languages: r.languages,
    coverLetter: n(r.cover_letter),
    source: n(r.source),
    sourceDetail: n(r.source_detail),
    referrerName: n(r.referrer_name),
    locale: n(r.locale),
    consentPrivacy: r.consent_privacy,
    consentPrivacyAt: n(r.consent_privacy_at),
    consentVersion: n(r.consent_version),
    consentTalentPool: r.consent_talent_pool,
    cvPath: n(r.cv_path),
    cvFilename: n(r.cv_filename),
    cvMime: n(r.cv_mime),
    cvSize: n(r.cv_size),
    status: r.status,
    rating: n(r.rating),
    tags: r.tags,
    assigneeId: n(r.assignee_id),
    assigneeName: n(r.assignee_name),
    rejectionReason: n(r.rejection_reason),
    readAt: n(r.read_at),
    lastActivityAt: n(r.last_activity_at),
    anonymizedAt: n(r.anonymized_at),
    extra: r.extra,
    createdBy: n(r.created_by),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  });
}

function activityFromRow(r: Row): JobApplicationActivity {
  return {
    id: String(r.id),
    applicationId: String(r.application_id),
    kind: r.kind as ActivityKind,
    body: (r.body as string) ?? undefined,
    meta: (r.meta as Record<string, unknown>) ?? {},
    actorId: (r.actor_id as string) ?? undefined,
    actorName: (r.actor_name as string) ?? undefined,
    createdAt: String(r.created_at),
  };
}

async function readLocal(): Promise<LocalFile> {
  const file = await readLocalJson<Partial<LocalFile>>(FILE, {});
  return {
    applications: (file.applications ?? []).map(normalizeApplication),
    activities: file.activities ?? [],
  };
}

export function applicationFiltersFromQuery(q: URLSearchParams): ApplicationFilters {
  return {
    q: q.get("q") ?? undefined,
    openingId: q.get("opening") ?? undefined,
    status: (q.get("status") as ApplicationFilters["status"]) ?? undefined,
    source: (q.get("source") as ApplicationFilters["source"]) ?? undefined,
  };
}

export async function listApplications(filters: ApplicationFilters = {}): Promise<JobApplication[]> {
  const db = careersClient();
  let all: JobApplication[];
  if (!db) {
    all = (await readLocal()).applications;
  } else {
    const { data, error } = await db
      .from("cms_job_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS);
    throwIfDbError(error);
    all = ((data ?? []) as Row[]).map(fromRow);
  }
  return all.filter((a) => matchesApplicationFilters(a, filters));
}

export async function getApplication(id: string): Promise<JobApplication | null> {
  if (!UUID_RE.test(id)) return null;
  const db = careersClient();
  if (!db) return (await readLocal()).applications.find((a) => a.id === id) ?? null;
  const { data, error } = await db.from("cms_job_applications").select("*").eq("id", id).maybeSingle();
  throwIfDbError(error);
  return data ? fromRow(data as Row) : null;
}

export async function listActivities(applicationId: string): Promise<JobApplicationActivity[]> {
  const db = careersClient();
  if (!db) {
    return (await readLocal()).activities
      .filter((a) => a.applicationId === applicationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const { data, error } = await db
    .from("cms_job_application_activities")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false })
    .limit(500);
  throwIfDbError(error);
  return ((data ?? []) as Row[]).map(activityFromRow);
}

/** Appends an activity and bumps last_activity_at. Bodies are stored, never logged. */
export async function addActivity(
  applicationId: string,
  kind: ActivityKind,
  actor: CareersActor | null,
  extra: { body?: string; meta?: Record<string, unknown> } = {}
): Promise<JobApplicationActivity> {
  const now = new Date().toISOString();
  const activity: JobApplicationActivity = {
    id: randomUUID(),
    applicationId,
    kind,
    body: extra.body,
    meta: extra.meta ?? {},
    actorId: actor?.id,
    actorName: actor?.name,
    createdAt: now,
  };
  const db = careersClient();
  if (!db) {
    const file = await readLocal();
    file.activities.push(activity);
    file.applications = file.applications.map((a) => (a.id === applicationId ? { ...a, lastActivityAt: now } : a));
    await writeLocal(file);
    return activity;
  }
  const { error } = await db.from("cms_job_application_activities").insert({
    id: activity.id,
    application_id: applicationId,
    kind,
    body: orNull(extra.body),
    meta: activity.meta,
    actor_id: orNull(actor?.id),
    actor_name: orNull(actor?.name),
    created_at: now,
  });
  throwIfDbError(error);
  const { error: touchError } = await db
    .from("cms_job_applications")
    .update({ last_activity_at: now })
    .eq("id", applicationId);
  if (touchError) {
    console.warn("[careers] last_activity_at update failed", { applicationId, code: touchError.code });
  }
  return activity;
}

async function writeLocal(file: LocalFile) {
  await writeLocalJson(FILE, file);
}

async function persist(app: JobApplication, isNew: boolean) {
  const db = careersClient();
  if (!db) {
    const file = await readLocal();
    file.applications = isNew
      ? [app, ...file.applications]
      : file.applications.map((a) => (a.id === app.id ? app : a));
    await writeLocal(file);
    return;
  }
  const row = toRow(app);
  const { error } = isNew
    ? await db.from("cms_job_applications").insert(row)
    : await db.from("cms_job_applications").update(row).eq("id", app.id);
  if (error?.code === "23503") throw new CareersError(400, "openingNotFound");
  throwIfDbError(error);
}

/** Manual create: source defaults to "manual", consent is required by validation. */
export async function createApplication(input: unknown, actor: CareersActor): Promise<JobApplication> {
  const now = new Date().toISOString();
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const app = normalizeApplication({
    ...raw,
    id: randomUUID(),
    source: raw.source ?? "manual",
    status: "new",
    consentPrivacyAt: now,
    cvPath: undefined,
    cvFilename: undefined,
    cvMime: undefined,
    cvSize: undefined,
    anonymizedAt: undefined,
    createdBy: actor.id,
    createdAt: now,
    updatedAt: now,
  });
  const valid = validateApplication(app);
  if (!valid.ok) throw new CareersError(400, valid.errors[0]);
  await persist({ ...app, lastActivityAt: now, readAt: now }, true);
  await addActivity(app.id, "created", actor);
  return app;
}

export async function patchApplication(id: string, patch: unknown, actor: CareersActor): Promise<JobApplication> {
  const current = await getApplication(id);
  if (!current) throw new CareersError(404, "not_found");
  if (current.anonymizedAt) throw new CareersError(409, "anonymized");
  const raw = (patch && typeof patch === "object" ? patch : {}) as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...current };
  for (const key of PATCHABLE) if (key in raw) merged[key] = raw[key];
  const next = normalizeApplication({ ...merged, updatedAt: new Date().toISOString() });
  const valid = validateApplication(next);
  if (!valid.ok) throw new CareersError(400, valid.errors[0]);
  await persist(next, false);

  if (next.status !== current.status) {
    await addActivity(id, "status_change", actor, { meta: { from: current.status, to: next.status } });
  }
  if (next.rating !== current.rating) {
    await addActivity(id, "rating", actor, { meta: { from: current.rating ?? null, to: next.rating ?? null } });
  }
  const changed = PATCHABLE.filter(
    (k) => k !== "status" && k !== "rating" && JSON.stringify(current[k]) !== JSON.stringify(next[k])
  );
  // Field names only: values may be PII.
  if (changed.length) await addActivity(id, "updated", actor, { meta: { fields: changed } });
  return (await getApplication(id)) ?? next;
}

export async function addNote(id: string, body: string, actor: CareersActor) {
  const text = body.trim();
  if (!text || text.length > 4000) throw new CareersError(400, "invalidNote");
  const current = await getApplication(id);
  if (!current) throw new CareersError(404, "not_found");
  if (current.anonymizedAt) throw new CareersError(409, "anonymized");
  return addActivity(id, "note", actor, { body: text });
}

/** Stamps readAt the first time an application is opened. */
export async function markApplicationRead(id: string): Promise<JobApplication> {
  const current = await getApplication(id);
  if (!current) throw new CareersError(404, "not_found");
  if (current.readAt || current.anonymizedAt) return current;
  const now = new Date().toISOString();
  const db = careersClient();
  if (!db) {
    const file = await readLocal();
    file.applications = file.applications.map((a) =>
      a.id === id && !a.readAt && !a.anonymizedAt ? { ...a, readAt: now } : a
    );
    await writeLocal(file);
  } else {
    const { error } = await db
      .from("cms_job_applications")
      .update({ read_at: now })
      .eq("id", id)
      .is("read_at", null)
      .is("anonymized_at", null);
    throwIfDbError(error);
  }
  return (await getApplication(id)) ?? current;
}

export async function deleteApplication(id: string): Promise<void> {
  const current = await getApplication(id);
  if (!current) throw new CareersError(404, "not_found");
  await removeAllCvObjects(id);
  const db = careersClient();
  if (!db) {
    const file = await readLocal();
    file.applications = file.applications.filter((a) => a.id !== id);
    file.activities = file.activities.filter((a) => a.applicationId !== id);
    await writeLocal(file);
    return;
  }
  const { error } = await db.from("cms_job_applications").delete().eq("id", id);
  throwIfDbError(error);
}

async function deleteNotes(id: string) {
  const db = careersClient();
  if (!db) {
    const file = await readLocal();
    file.activities = file.activities.filter((a) => a.applicationId !== id || a.kind !== "note");
    await writeLocal(file);
    return;
  }
  const { error } = await db
    .from("cms_job_application_activities")
    .delete()
    .eq("application_id", id)
    .eq("kind", "note");
  throwIfDbError(error);
}

/** Replaces PII with placeholders, drops the CV object and activity bodies, sets anonymized_at. */
export async function anonymizeApplication(id: string, actor: CareersActor): Promise<JobApplication> {
  const current = await getApplication(id);
  if (!current) throw new CareersError(404, "not_found");
  if (current.anonymizedAt) {
    await deleteNotes(id); // idempotent: lets a retry finish erasure
    return current;
  }
  await removeAllCvObjects(id);
  await deleteNotes(id);
  const now = new Date().toISOString();
  const anonymized: JobApplication = {
    id: current.id,
    openingId: current.openingId,
    fullName: "Anonymized",
    email: `anonymized-${current.id}@invalid.example`,
    languages: [],
    consentPrivacy: true,
    consentPrivacyAt: current.consentPrivacyAt,
    consentVersion: current.consentVersion,
    consentTalentPool: false,
    source: current.source,
    status: current.status,
    rating: current.rating,
    tags: [],
    readAt: current.readAt,
    lastActivityAt: now,
    anonymizedAt: now,
    extra: {},
    createdBy: current.createdBy,
    createdAt: current.createdAt,
    updatedAt: now,
  };
  await persist(anonymized, false);
  await addActivity(id, "anonymized", actor);
  return anonymized;
}

export async function setApplicationCv(
  id: string,
  cv: { path: string; filename: string; mime: string; size: number },
  actor: CareersActor | null
): Promise<JobApplication> {
  const current = await getApplication(id);
  if (!current) throw new CareersError(404, "not_found");
  if (current.anonymizedAt) throw new CareersError(409, "anonymized");
  const next: JobApplication = {
    ...current,
    cvPath: cv.path,
    cvFilename: cv.filename.slice(0, 255),
    cvMime: cv.mime,
    cvSize: cv.size,
    updatedAt: new Date().toISOString(),
  };
  await persist(next, false);
  if (current.cvPath && current.cvPath !== cv.path) await removeCvObject(current.cvPath);
  await addActivity(id, "cv_uploaded", actor, { meta: { mime: cv.mime, size: cv.size } });
  return next;
}

export async function clearApplicationCv(id: string, actor: CareersActor): Promise<JobApplication> {
  const current = await getApplication(id);
  if (!current) throw new CareersError(404, "not_found");
  if (!current.cvPath) return current;
  const next: JobApplication = {
    ...current,
    cvPath: undefined,
    cvFilename: undefined,
    cvMime: undefined,
    cvSize: undefined,
    updatedAt: new Date().toISOString(),
  };
  await removeCvObject(current.cvPath, true);
  await persist(next, false);
  await addActivity(id, "cv_removed", actor);
  return next;
}

/** Anonymous website submission: the caller has already forced source/status/consent. */
export async function insertPublicApplication(app: JobApplication): Promise<void> {
  await persist(app, true);
  await addActivity(app.id, "created", null);
}

/**
 * Replaces only the `extra` column. With `ifNoTicket` the write applies only while no CV ticket hash is stored,
 * so a restore can never overwrite a concurrent state. Returns whether a row was written.
 */
export async function patchApplicationExtra(
  id: string,
  extra: Record<string, unknown>,
  opts: { ifNoTicket?: boolean } = {}
): Promise<boolean> {
  const db = careersClient();
  if (!db) {
    const file = await readLocal();
    const found = file.applications.find((a) => a.id === id);
    if (!found) throw new CareersError(404, "not_found");
    if (opts.ifNoTicket && (found.extra as { cvTicketHash?: unknown })?.cvTicketHash) return false;
    file.applications = file.applications.map((a) => (a.id === id ? { ...a, extra } : a));
    await writeLocal(file);
    return true;
  }
  let query = db.from("cms_job_applications").update({ extra, updated_at: new Date().toISOString() }).eq("id", id);
  if (opts.ifNoTicket) query = query.is("extra->>cvTicketHash", null);
  const { data, error } = await query.select("id");
  throwIfDbError(error);
  return (data ?? []).length === 1;
}

/** Public confirm: sets the CV columns and the cleaned `extra` in ONE write, then logs the activity (best-effort). */
export async function attachPublicCv(
  id: string,
  cv: { path: string; filename: string; mime: string; size: number },
  extra: Record<string, unknown>
): Promise<void> {
  const updatedAt = new Date().toISOString();
  const db = careersClient();
  if (!db) {
    const file = await readLocal();
    if (!file.applications.some((a) => a.id === id)) throw new CareersError(404, "not_found");
    file.applications = file.applications.map((a) =>
      a.id === id
        ? { ...a, cvPath: cv.path, cvFilename: cv.filename, cvMime: cv.mime, cvSize: cv.size, extra, updatedAt }
        : a
    );
    await writeLocal(file);
  } else {
    const { data, error } = await db
      .from("cms_job_applications")
      .update({
        cv_path: cv.path,
        cv_filename: cv.filename.slice(0, 255),
        cv_mime: cv.mime,
        cv_size: cv.size,
        extra,
        updated_at: updatedAt,
      })
      .eq("id", id)
      .is("anonymized_at", null)
      .select("id");
    throwIfDbError(error);
    if ((data ?? []).length !== 1) throw new CareersError(409, "anonymized");
  }
  try {
    await addActivity(id, "cv_uploaded", null, { meta: { mime: cv.mime, size: cv.size } });
  } catch (error) {
    console.error("[careers] cv_uploaded activity failed", { id, code: error instanceof Error ? error.message : "unknown" });
  }
}

type PurgeRows = Array<{ id: string }>;

/** Website rows whose CV was never confirmed (> 24 h, no cv_path), oldest first. */
export async function listExpiredPendingIds(now: number, limit: number): Promise<string[]> {
  const cutoff = new Date(now - PENDING_CV_TTL_MS).toISOString();
  const db = careersClient();
  if (!db) {
    return (await readLocal()).applications
      .filter((a) => isExpiredPending(a, now))
      .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))
      .slice(0, limit)
      .map((a) => a.id);
  }
  const { data, error } = await db
    .from("cms_job_applications")
    .select("id")
    .eq("source", "website")
    .eq("extra->>cvPending", "true")
    .is("cv_path", null)
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(limit);
  throwIfDbError(error);
  return ((data ?? []) as PurgeRows).map((r) => r.id);
}

/** Not-yet-anonymized rows past retention (365 d, 730 d with talent pool consent), oldest first. */
export async function listRetentionExpiredIds(now: number, limit: number): Promise<string[]> {
  const db = careersClient();
  if (!db) {
    return (await readLocal()).applications
      .filter((a) => isRetentionExpired(a, now))
      .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))
      .slice(0, limit)
      .map((a) => a.id);
  }
  const ids: Array<{ id: string; created_at: string }> = [];
  for (const [talentPool, days] of [[false, RETENTION_DAYS], [true, TALENT_POOL_RETENTION_DAYS]] as const) {
    const { data, error } = await db
      .from("cms_job_applications")
      .select("id, created_at")
      .is("anonymized_at", null)
      .eq("consent_talent_pool", talentPool)
      .lt("created_at", new Date(now - days * DAY_MS).toISOString())
      .order("created_at", { ascending: true })
      .limit(limit);
    throwIfDbError(error);
    ids.push(...((data ?? []) as typeof ids));
  }
  return ids.sort((a, b) => a.created_at.localeCompare(b.created_at)).slice(0, limit).map((r) => r.id);
}

/** Id of a recent website application by the same email for this opening (null = talent pool); unconfirmed (cvPending) rows are ignored. */
export async function findRecentDuplicate(email: string, openingId: string | null, windowMs: number): Promise<string | null> {
  const mail = email.trim().toLowerCase();
  const since = new Date(Date.now() - windowMs).toISOString();
  const db = careersClient();
  let rows: Array<{ id: string; extra?: unknown }>;
  if (!db) {
    rows = (await readLocal()).applications.filter(
      (a) => a.source === "website" && a.email === mail && (a.openingId ?? null) === openingId && (a.createdAt ?? "") >= since
    );
  } else {
    let query = db
      .from("cms_job_applications")
      .select("id, extra")
      .eq("source", "website")
      .eq("email", mail)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20);
    query = openingId ? query.eq("opening_id", openingId) : query.is("opening_id", null);
    const { data, error } = await query;
    throwIfDbError(error);
    rows = (data ?? []) as typeof rows;
  }
  const hit = rows.find((r) => (r.extra as { cvPending?: unknown } | null)?.cvPending !== true);
  return hit?.id ?? null;
}

/**
 * Atomically consumes the CV ticket: succeeds only if the stored ticket hash still equals `ticketHash`.
 * Returns false when another request already consumed it.
 */
export async function consumeCvTicket(id: string, ticketHash: string, nextExtra: Record<string, unknown>): Promise<boolean> {
  const db = careersClient();
  if (!db) {
    const file = await readLocal();
    const app = file.applications.find((a) => a.id === id);
    if (!app || (app.extra as { cvTicketHash?: unknown })?.cvTicketHash !== ticketHash) return false;
    file.applications = file.applications.map((a) => (a.id === id ? { ...a, extra: nextExtra } : a));
    await writeLocal(file);
    return true;
  }
  const { data, error } = await db
    .from("cms_job_applications")
    .update({ extra: nextExtra, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("extra->>cvTicketHash", ticketHash)
    .select("id");
  throwIfDbError(error);
  return (data ?? []).length === 1;
}
