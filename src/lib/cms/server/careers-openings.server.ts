import "server-only";

import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  sanitizeLocalizedPlainText,
  sanitizeLocalizedRichHtml,
} from "@/lib/cms/sanitize-rich-html.server";
import { matchesOpeningFilters } from "@/lib/cms/careers/filters";
import { applyOpeningAction, duplicateOpening, type OpeningAction } from "@/lib/cms/careers/lifecycle";
import { normalizeLocalized, normalizeOpening, validateOpening } from "@/lib/cms/careers/validation";
import {
  PIPELINE_STATUSES,
  type JobOpening,
  type JobOpeningWithStats,
  type OpeningFilters,
  type PipelineCounts,
} from "@/lib/cms/careers/types";
import { revalidateCareersPages } from "@/lib/cms/revalidate-site";
import {
  CareersError,
  UUID_RE,
  careersClient,
  orNull,
  readLocalJson,
  throwIfDbError,
  writeLocalJson,
} from "@/lib/cms/server/careers-core.server";

const OPENINGS_FILE = path.join(process.cwd(), "data", "cms", "careers-openings.json");
const APPLICATIONS_FILE = path.join(process.cwd(), "data", "cms", "careers-applications.json");

type Row = Record<string, unknown>;
type Stats = NonNullable<JobOpeningWithStats["stats"]>;

function toRow(o: JobOpening): Row {
  return {
    id: o.id,
    slug: o.slug,
    title: o.title,
    summary: o.summary,
    description: o.description,
    responsibilities: o.responsibilities,
    requirements: o.requirements,
    nice_to_have: o.niceToHave,
    benefits: o.benefits,
    department: orNull(o.department),
    country_code: orNull(o.countryCode),
    city: orNull(o.city),
    work_model: orNull(o.workModel),
    employment_type: orNull(o.employmentType),
    seniority: orNull(o.seniority),
    positions: o.positions,
    salary_min: orNull(o.salaryMin),
    salary_max: orNull(o.salaryMax),
    salary_currency: orNull(o.salaryCurrency),
    salary_period: orNull(o.salaryPeriod),
    show_salary: o.showSalary,
    status: o.status,
    publish_at: orNull(o.publishAt),
    close_at: orNull(o.closeAt),
    published_at: orNull(o.publishedAt),
    closed_at: orNull(o.closedAt),
    hiring_manager_id: orNull(o.hiringManagerId),
    hiring_manager_name: orNull(o.hiringManagerName),
    recruiter_id: orNull(o.recruiterId),
    recruiter_name: orNull(o.recruiterName),
    seo: o.seo ?? {},
    created_by: orNull(o.createdBy),
    updated_by: orNull(o.updatedBy),
  };
}

const nul = (v: unknown) => (v === null || v === undefined ? undefined : v);

function fromRow(r: Row): JobOpening {
  return normalizeOpening({
    id: r.id,
    slug: r.slug,
    title: normalizeLocalized(r.title),
    summary: r.summary,
    description: r.description,
    responsibilities: r.responsibilities,
    requirements: r.requirements,
    niceToHave: r.nice_to_have,
    benefits: r.benefits,
    department: nul(r.department),
    countryCode: nul(r.country_code),
    city: nul(r.city),
    workModel: nul(r.work_model),
    employmentType: nul(r.employment_type),
    seniority: nul(r.seniority),
    positions: r.positions,
    salaryMin: nul(r.salary_min),
    salaryMax: nul(r.salary_max),
    salaryCurrency: nul(r.salary_currency),
    salaryPeriod: nul(r.salary_period),
    showSalary: r.show_salary,
    status: r.status,
    publishAt: nul(r.publish_at),
    closeAt: nul(r.close_at),
    publishedAt: nul(r.published_at),
    closedAt: nul(r.closed_at),
    hiringManagerId: nul(r.hiring_manager_id),
    hiringManagerName: nul(r.hiring_manager_name),
    recruiterId: nul(r.recruiter_id),
    recruiterName: nul(r.recruiter_name),
    seo: r.seo,
    createdBy: nul(r.created_by),
    updatedBy: nul(r.updated_by),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  });
}

async function readAll(): Promise<JobOpening[]> {
  const db = careersClient();
  if (!db) return (await readLocalJson<unknown[]>(OPENINGS_FILE, [])).map(normalizeOpening);
  const { data, error } = await db.from("cms_job_openings").select("*").order("updated_at", { ascending: false });
  throwIfDbError(error);
  return ((data ?? []) as Row[]).map(fromRow);
}

async function readStats(): Promise<Map<string, Stats>> {
  const map = new Map<string, Stats>();
  const db = careersClient();
  if (!db) {
    const file = await readLocalJson<{ applications?: Array<{ openingId?: string | null; status: string; createdAt?: string }> }>(
      APPLICATIONS_FILE,
      {}
    );
    for (const app of file.applications ?? []) {
      if (!app.openingId) continue;
      const cur: Stats =
        map.get(app.openingId) ??
        ({ total: 0, ...Object.fromEntries(PIPELINE_STATUSES.map((s) => [s, 0])) } as Stats);
      cur.total += 1;
      if (app.status in cur) (cur as unknown as Record<string, number>)[app.status] += 1;
      if (app.createdAt && (!cur.lastAppliedAt || app.createdAt > cur.lastAppliedAt)) cur.lastAppliedAt = app.createdAt;
      map.set(app.openingId, cur);
    }
    return map;
  }
  const { data, error } = await db.from("cms_job_opening_stats").select("*");
  throwIfDbError(error);
  for (const r of (data ?? []) as Row[]) {
    const stats = { total: Number(r.total) || 0, lastAppliedAt: (r.last_applied_at as string) ?? undefined } as Stats;
    for (const s of PIPELINE_STATUSES) stats[s] = Number(r[`${s}_count`]) || 0;
    map.set(String(r.opening_id), stats);
  }
  return map;
}

/** Columns the public site may read: no owners, audit ids or seo internals. */
const PUBLIC_COLUMNS =
  "id,slug,title,summary,description,responsibilities,requirements,nice_to_have,benefits,department,country_code,city,work_model,employment_type,seniority,positions,salary_min,salary_max,salary_currency,salary_period,show_salary,status,publish_at,close_at,published_at,created_at,updated_at";

/** Published rows only, explicit columns. Callers still apply isOpeningPublic (embargo / close date). */
export async function readPublishedOpenings(): Promise<JobOpening[]> {
  const db = careersClient();
  if (!db) return (await readAll()).filter((o) => o.status === "published");
  const { data, error } = await db
    .from("cms_job_openings")
    .select(PUBLIC_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(500);
  throwIfDbError(error);
  return ((data ?? []) as unknown as Row[]).map(fromRow);
}

/** Best-effort: cache busting must never fail a save. Logs the error name only. */
function bustPublicPages(...slugs: Array<string | undefined>) {
  try {
    revalidateCareersPages(slugs.filter((s): s is string => !!s));
  } catch (error) {
    console.warn("[careers] revalidate skipped", error instanceof Error ? error.name : "unknown");
  }
}

export async function listOpenings(filters: OpeningFilters = {}): Promise<JobOpeningWithStats[]> {
  const [all, stats] = await Promise.all([readAll(), readStats()]);
  const empty = { total: 0, ...Object.fromEntries(PIPELINE_STATUSES.map((s) => [s, 0])) } as PipelineCounts;
  return all
    .filter((o) => matchesOpeningFilters(o, filters))
    .map((o) => ({ ...o, stats: stats.get(o.id) ?? empty }));
}

export async function getOpening(id: string): Promise<JobOpening | null> {
  if (!UUID_RE.test(id)) return null;
  return (await readAll()).find((o) => o.id === id) ?? null;
}

/** Validates, enforces unique slug, stamps published_at/closed_at on status transitions, persists. */
export async function saveOpening(input: unknown, actor: { id: string }): Promise<JobOpening> {
  const parsed = normalizeOpening(input);
  const incoming: JobOpening = {
    ...parsed,
    title: sanitizeLocalizedPlainText(parsed.title),
    summary: sanitizeLocalizedPlainText(parsed.summary),
    description: sanitizeLocalizedRichHtml(parsed.description),
    responsibilities: sanitizeLocalizedRichHtml(parsed.responsibilities),
    requirements: sanitizeLocalizedRichHtml(parsed.requirements),
    niceToHave: sanitizeLocalizedRichHtml(parsed.niceToHave),
    benefits: sanitizeLocalizedRichHtml(parsed.benefits),
  };
  const all = await readAll();
  const id = UUID_RE.test(incoming.id) ? incoming.id : randomUUID();
  const existing = all.find((o) => o.id === id) ?? null;
  const now = new Date().toISOString();
  const opening: JobOpening = {
    ...incoming,
    id,
    createdBy: existing?.createdBy ?? actor.id,
    updatedBy: actor.id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    publishedAt: existing?.publishedAt,
    closedAt: existing?.closedAt,
  };
  if (opening.status === "published" && existing?.status !== "published") {
    opening.publishedAt = existing?.publishedAt ?? now;
    opening.closedAt = undefined;
  }
  if (opening.status === "closed" && existing?.status !== "closed") opening.closedAt = now;

  const valid = validateOpening(opening);
  if (!valid.ok) throw new CareersError(400, valid.errors[0]);
  if (all.some((o) => o.id !== id && o.slug === opening.slug)) throw new CareersError(409, "slugTaken");

  const db = careersClient();
  if (!db) {
    await writeLocalJson(OPENINGS_FILE, [opening, ...all.filter((o) => o.id !== id)]);
    bustPublicPages(opening.slug, existing?.slug);
    return opening;
  }
  const { error } = await db.from("cms_job_openings").upsert(toRow(opening)).select("id").single();
  if (error?.code === "23505") throw new CareersError(409, "slugTaken");
  throwIfDbError(error);
  bustPublicPages(opening.slug, existing?.slug);
  return (await getOpening(id)) ?? opening;
}

/** The opening as it will be saved after the action (duplicate returns the new draft). */
export async function buildOpeningForAction(id: string, action: OpeningAction | "duplicate"): Promise<JobOpening> {
  const current = await getOpening(id);
  if (!current) throw new CareersError(404, "not_found");
  if (action === "duplicate") {
    const slugs = (await readAll()).map((o) => o.slug);
    return duplicateOpening(current, randomUUID(), slugs);
  }
  const next = applyOpeningAction(current, action);
  if (!next) throw new CareersError(409, "invalidTransition");
  return next;
}

export async function countOpeningApplications(id: string): Promise<number> {
  const db = careersClient();
  if (!db) {
    const file = await readLocalJson<{ applications?: Array<{ openingId?: string | null }> }>(APPLICATIONS_FILE, {});
    return (file.applications ?? []).filter((a) => a.openingId === id).length;
  }
  const { count, error } = await db
    .from("cms_job_applications")
    .select("id", { count: "exact", head: true })
    .eq("opening_id", id);
  throwIfDbError(error);
  return count ?? 0;
}

export async function deleteOpening(id: string): Promise<void> {
  const db = careersClient();
  if (!db) {
    const file = await readLocalJson<{ applications?: Array<{ openingId?: string | null }> }>(APPLICATIONS_FILE, {});
    if ((file.applications ?? []).some((a) => a.openingId === id)) throw new CareersError(409, "hasApplications");
    const all = await readAll();
    await writeLocalJson(OPENINGS_FILE, all.filter((o) => o.id !== id));
    bustPublicPages(all.find((o) => o.id === id)?.slug);
    return;
  }
  const slug = (await getOpening(id))?.slug;
  const { error } = await db.from("cms_job_openings").delete().eq("id", id);
  if (error?.code === "23503") throw new CareersError(409, "hasApplications");
  throwIfDbError(error);
  bustPublicPages(slug);
}
