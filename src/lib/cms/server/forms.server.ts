import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  FormActivity,
  FormActivityKind,
  FormSubmission,
  FormSubmissionPatch,
  FormSubmissionStatus,
} from "@/lib/cms/types";
import {
  OPEN_LEAD_STATUSES,
  leadEmail,
  normalizePriority,
  normalizeSubmissionStatus,
  normalizeTags,
} from "@/lib/cms/forms/crm";
import {
  addFormSubmission as addToMemory,
  anonymizeFormSubmission as anonymizeMemory,
  deleteFormSubmission as deleteMemory,
  getFormSubmissions as getFromMemory,
  replaceFormSubmissionsCache,
} from "@/lib/cms/repositories/forms-repository";
import { writeLocalJsonFile } from "@/lib/cms/server/local-fs.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

const FORMS_FILE = path.join(process.cwd(), "data", "cms", "form-submissions.json");
const ACTIVITIES_FILE = path.join(process.cwd(), "data", "cms", "form-activities.json");
const CRM_MIGRATION = "20261001_cms_form_crm.sql";

const BASE_COLUMNS = "id, type, status, data, created_at";
const CRM_COLUMNS = `${BASE_COLUMNS}, assignee_id, assignee_name, tags, priority, read_at, updated_at, last_activity_at`;

let hydrated = false;
let activitiesHydrated = false;
let activitiesCache: FormActivity[] = [];
/** null = unknown until the first query tells us whether the CRM columns exist */
let crmColumnsAvailable: boolean | null = null;

type FormRow = {
  id: string;
  type: string;
  status: string;
  data: Record<string, unknown>;
  created_at: string;
  assignee_id?: string | null;
  assignee_name?: string | null;
  tags?: string[] | null;
  priority?: string | null;
  read_at?: string | null;
  updated_at?: string | null;
  last_activity_at?: string | null;
};

type ActivityRow = {
  id: string;
  submission_id: string;
  kind: string;
  body: string | null;
  meta: Record<string, unknown> | null;
  actor_id: string | null;
  actor_name: string | null;
  created_at: string;
};

export type FormActor = { id?: string | null; name?: string | null };

function rowToSubmission(row: FormRow): FormSubmission {
  return {
    id: row.id,
    type: row.type as FormSubmission["type"],
    status: normalizeSubmissionStatus(row.status),
    data: row.data ?? {},
    createdAt: row.created_at,
    assigneeId: row.assignee_id ?? null,
    assigneeName: row.assignee_name ?? null,
    tags: normalizeTags(row.tags ?? []),
    priority: normalizePriority(row.priority),
    readAt: row.read_at ?? null,
    updatedAt: row.updated_at ?? null,
    lastActivityAt: row.last_activity_at ?? null,
  };
}

function normalizeLocal(entry: FormSubmission): FormSubmission {
  const status = normalizeSubmissionStatus(entry.status);
  return {
    ...entry,
    status,
    tags: normalizeTags(entry.tags ?? []),
    priority: normalizePriority(entry.priority),
    readAt: entry.readAt ?? (String(entry.status) === "read" ? entry.createdAt : null),
  };
}

function rowToActivity(row: ActivityRow): FormActivity {
  return {
    id: row.id,
    submissionId: row.submission_id,
    kind: row.kind as FormActivityKind,
    body: row.body,
    meta: row.meta ?? {},
    actorId: row.actor_id,
    actorName: row.actor_name,
    createdAt: row.created_at,
  };
}

type PgError = { code?: string; message?: string } | null;

function isMissingColumn(error: PgError) {
  return Boolean(error && (error.code === "42703" || error.code === "PGRST204"));
}

function isMissingTable(error: PgError) {
  return Boolean(error && (error.code === "PGRST205" || error.code === "42P01"));
}

function crmSetupError() {
  return new Error(`Lead management storage is not set up: apply migration ${CRM_MIGRATION}`);
}

async function hydrateFromDisk() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await readFile(FORMS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as FormSubmission[];
    if (Array.isArray(parsed)) {
      replaceFormSubmissionsCache(parsed.map(normalizeLocal));
      return;
    }
  } catch {
    // Keep module seed when file is missing.
  }
  replaceFormSubmissionsCache(getFromMemory().map(normalizeLocal));
}

async function hydrateActivitiesFromDisk() {
  if (activitiesHydrated) return;
  activitiesHydrated = true;
  try {
    const raw = await readFile(ACTIVITIES_FILE, "utf-8");
    const parsed = JSON.parse(raw) as FormActivity[];
    if (Array.isArray(parsed)) activitiesCache = parsed;
  } catch {
    activitiesCache = [];
  }
}

function writeClient() {
  if (isServiceRoleConfigured()) return createServiceClient();
  return null;
}

function requireWriteClient() {
  const client = writeClient();
  if (!client) {
    throw new Error("Form storage is unavailable");
  }
  return client;
}

function selectColumns() {
  return crmColumnsAvailable === false ? BASE_COLUMNS : CRM_COLUMNS;
}

async function readFormsFromSupabase(): Promise<FormSubmission[]> {
  const client = requireWriteClient();

  const run = () =>
    client
      .from("cms_form_submissions")
      .select(selectColumns())
      .order("created_at", { ascending: false });

  let { data, error } = await run();
  if (isMissingColumn(error) && crmColumnsAvailable !== false) {
    crmColumnsAvailable = false;
    ({ data, error } = await run());
  } else if (!error && crmColumnsAvailable === null) {
    crmColumnsAvailable = true;
  }

  if (error) throw new Error(error.message);
  return ((data as unknown as FormRow[] | null) ?? []).map(rowToSubmission);
}

/** Sidebar badge counts — reads only status/read_at, never the lead payloads. */
export async function readLeadCounts(): Promise<{ unread: number; open: number }> {
  if (!isSupabaseConfigured()) {
    return countLeads(await readFormSubmissions());
  }
  const client = requireWriteClient();
  const run = (columns: string) =>
    client.from("cms_form_submissions").select(columns);
  let { data, error } = await run(
    crmColumnsAvailable === false ? "status" : "status, read_at"
  );
  if (isMissingColumn(error) && crmColumnsAvailable !== false) {
    crmColumnsAvailable = false;
    ({ data, error } = await run("status"));
  }
  if (error) throw new Error(error.message);
  const rows = (data as unknown as Array<{ status: string; read_at?: string | null }> | null) ?? [];
  return countLeads(
    rows.map((row) => ({
      status: normalizeSubmissionStatus(row.status),
      readAt: row.read_at ?? null,
    }))
  );
}

function countLeads(rows: Array<Pick<FormSubmission, "status" | "readAt">>) {
  let unread = 0;
  let open = 0;
  for (const row of rows) {
    if (OPEN_LEAD_STATUSES.includes(row.status)) open += 1;
    if (!row.readAt && row.status === "new") unread += 1;
  }
  return { unread, open };
}

export function isCrmStorageReady() {
  return !isSupabaseConfigured() || crmColumnsAvailable !== false;
}

export async function readFormSubmissions(
  type?: FormSubmission["type"]
): Promise<FormSubmission[]> {
  if (isSupabaseConfigured()) {
    const remote = await readFormsFromSupabase();
    replaceFormSubmissionsCache(remote);
    hydrated = true;
    return type ? remote.filter((s) => s.type === type) : remote;
  }

  await hydrateFromDisk();
  return getFromMemory(type);
}

export async function readFormSubmissionById(id: string): Promise<FormSubmission | null> {
  if (isSupabaseConfigured()) {
    const client = requireWriteClient();
    const run = () =>
      client.from("cms_form_submissions").select(selectColumns()).eq("id", id).maybeSingle();
    let { data, error } = await run();
    if (isMissingColumn(error) && crmColumnsAvailable !== false) {
      crmColumnsAvailable = false;
      ({ data, error } = await run());
    }
    if (error) {
      if (error.code === "22P02") return null;
      throw new Error(error.message);
    }
    return data ? rowToSubmission(data as unknown as FormRow) : null;
  }
  await hydrateFromDisk();
  return getFromMemory().find((s) => s.id === id) ?? null;
}

export async function readSubmissionsByEmail(
  email: string,
  excludeId?: string
): Promise<FormSubmission[]> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return [];
  const all = await readFormSubmissions();
  return all.filter((s) => s.id !== excludeId && leadEmail(s) === normalized);
}

export async function addFormSubmissionDurable(
  submission: Omit<FormSubmission, "id" | "createdAt">
): Promise<FormSubmission> {
  if (isSupabaseConfigured()) {
    const client = requireWriteClient();
    const { data, error } = await client
      .from("cms_form_submissions")
      .insert({
        type: submission.type,
        status: submission.status,
        data: submission.data,
      })
      .select(BASE_COLUMNS)
      .single();

    if (error) throw new Error(error.message);
    const entry = rowToSubmission(data as FormRow);
    await readFormSubmissions();
    return entry;
  }

  await hydrateFromDisk();
  const entry = addToMemory(submission);
  await writeLocalJsonFile(FORMS_FILE, getFromMemory());
  return entry;
}

function patchToRow(patch: FormSubmissionPatch, now: string) {
  const row: Record<string, unknown> = { updated_at: now, last_activity_at: now };
  if (patch.status) row.status = patch.status;
  if (patch.assigneeId !== undefined) {
    row.assignee_id = patch.assigneeId || null;
    row.assignee_name = patch.assigneeId ? (patch.assigneeName ?? null) : null;
  }
  if (patch.tags !== undefined) row.tags = normalizeTags(patch.tags);
  if (patch.priority !== undefined) row.priority = normalizePriority(patch.priority);
  if (patch.read !== undefined) row.read_at = patch.read ? now : null;
  return row;
}

function applyPatchLocal(entry: FormSubmission, patch: FormSubmissionPatch, now: string): FormSubmission {
  const next: FormSubmission = { ...entry, updatedAt: now, lastActivityAt: now };
  if (patch.status) next.status = patch.status;
  if (patch.assigneeId !== undefined) {
    next.assigneeId = patch.assigneeId || null;
    next.assigneeName = patch.assigneeId ? (patch.assigneeName ?? null) : null;
  }
  if (patch.tags !== undefined) next.tags = normalizeTags(patch.tags);
  if (patch.priority !== undefined) next.priority = normalizePriority(patch.priority);
  if (patch.read !== undefined) next.readAt = patch.read ? now : null;
  return next;
}

function patchNeedsCrmColumns(patch: FormSubmissionPatch) {
  return patch.assigneeId !== undefined || patch.tags !== undefined || patch.priority !== undefined;
}

/** Applies the same patch to one or many submissions. Returns the updated rows. */
export async function updateFormSubmissions(
  ids: string[],
  patch: FormSubmissionPatch
): Promise<FormSubmission[]> {
  if (ids.length === 0) return [];
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const client = requireWriteClient();
    if (crmColumnsAvailable === null) await readFormsFromSupabase();
    const legacy = crmColumnsAvailable === false;
    if (legacy) {
      if (patchNeedsCrmColumns(patch)) throw crmSetupError();
      // Unread tracking needs read_at; before the migration only status persists.
      if (!patch.status) return [];
    }
    const row = legacy ? { status: patch.status } : patchToRow(patch, now);
    const { data, error } = await client
      .from("cms_form_submissions")
      .update(row)
      .in("id", ids)
      .select(legacy ? BASE_COLUMNS : CRM_COLUMNS);
    if (error) {
      if (isMissingColumn(error)) {
        crmColumnsAvailable = false;
        throw crmSetupError();
      }
      throw new Error(error.message);
    }
    const updated = ((data as unknown as FormRow[] | null) ?? []).map(rowToSubmission);
    const byId = new Map(updated.map((s) => [s.id, s]));
    replaceFormSubmissionsCache(getFromMemory().map((s) => byId.get(s.id) ?? s));
    return updated;
  }

  await hydrateFromDisk();
  const wanted = new Set(ids);
  const updated: FormSubmission[] = [];
  const next = getFromMemory().map((entry) => {
    if (!wanted.has(entry.id)) return entry;
    const patched = applyPatchLocal(entry, patch, now);
    updated.push(patched);
    return patched;
  });
  if (updated.length) {
    replaceFormSubmissionsCache(next);
    await writeLocalJsonFile(FORMS_FILE, next);
  }
  return updated;
}

export async function updateFormSubmissionStatusDurable(
  id: string,
  status: FormSubmissionStatus
): Promise<FormSubmission | null> {
  const [updated] = await updateFormSubmissions([id], { status });
  return updated ?? null;
}

export async function deleteFormSubmissionDurable(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const client = requireWriteClient();
    const { error } = await client.from("cms_form_submissions").delete().eq("id", id);
    if (error) throw new Error(error.message);
    deleteMemory(id);
    return true;
  }
  await hydrateFromDisk();
  const ok = deleteMemory(id);
  if (ok) {
    await writeLocalJsonFile(FORMS_FILE, getFromMemory());
    await hydrateActivitiesFromDisk();
    activitiesCache = activitiesCache.filter((a) => a.submissionId !== id);
    await writeLocalJsonFile(ACTIVITIES_FILE, activitiesCache);
  }
  return ok;
}

export async function anonymizeFormSubmissionDurable(
  id: string
): Promise<FormSubmission | null> {
  if (isSupabaseConfigured()) {
    const client = requireWriteClient();
    const { data, error } = await client
      .from("cms_form_submissions")
      .update({ data: { redacted: true } })
      .eq("id", id)
      .select(selectColumns())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const entry = rowToSubmission(data as unknown as FormRow);
    anonymizeMemory(id);
    // Notes may quote personal data; drop them along with the payload.
    const { error: activityError } = await client
      .from("cms_form_activities")
      .update({ body: null, meta: { redacted: true } })
      .eq("submission_id", id)
      .in("kind", ["note", "reply"]);
    if (activityError && !isMissingTable(activityError)) throw new Error(activityError.message);
    return entry;
  }
  await hydrateFromDisk();
  const updated = anonymizeMemory(id);
  if (updated) {
    await writeLocalJsonFile(FORMS_FILE, getFromMemory());
    await hydrateActivitiesFromDisk();
    activitiesCache = activitiesCache.map((a) =>
      a.submissionId === id && (a.kind === "note" || a.kind === "reply")
        ? { ...a, body: null, meta: { redacted: true } }
        : a
    );
    await writeLocalJsonFile(ACTIVITIES_FILE, activitiesCache);
  }
  return updated;
}

export async function purgeFormSubmissionsOlderThan(
  days: number
): Promise<number> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  if (isSupabaseConfigured()) {
    const client = requireWriteClient();
    const { data, error } = await client
      .from("cms_form_submissions")
      .delete()
      .lt("created_at", cutoff)
      .select("id");
    if (error) throw new Error(error.message);
    return data?.length ?? 0;
  }
  await hydrateFromDisk();
  const remaining = getFromMemory().filter((row) => row.createdAt >= cutoff);
  const removed = getFromMemory().length - remaining.length;
  replaceFormSubmissionsCache(remaining);
  await writeLocalJsonFile(FORMS_FILE, remaining);
  return removed;
}

// ---------------------------------------------------------------------------
// Activities (timeline)
// ---------------------------------------------------------------------------

export async function readFormActivities(submissionId: string): Promise<FormActivity[]> {
  if (isSupabaseConfigured()) {
    const client = requireWriteClient();
    const { data, error } = await client
      .from("cms_form_activities")
      .select("id, submission_id, kind, body, meta, actor_id, actor_name, created_at")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false });
    if (error) {
      if (isMissingTable(error) || error.code === "22P02") return [];
      throw new Error(error.message);
    }
    return ((data as ActivityRow[] | null) ?? []).map(rowToActivity);
  }
  await hydrateActivitiesFromDisk();
  return activitiesCache
    .filter((a) => a.submissionId === submissionId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type NewFormActivity = {
  submissionId: string;
  kind: FormActivityKind;
  body?: string | null;
  meta?: Record<string, unknown>;
  actor?: FormActor;
};

export async function addFormActivities(entries: NewFormActivity[]): Promise<FormActivity[]> {
  if (entries.length === 0) return [];
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const client = requireWriteClient();
    const { data, error } = await client
      .from("cms_form_activities")
      .insert(
        entries.map((e) => ({
          submission_id: e.submissionId,
          kind: e.kind,
          body: e.body ?? null,
          meta: e.meta ?? {},
          actor_id: e.actor?.id ?? null,
          actor_name: e.actor?.name ?? null,
        }))
      )
      .select("id, submission_id, kind, body, meta, actor_id, actor_name, created_at");
    if (error) {
      if (isMissingTable(error)) throw crmSetupError();
      throw new Error(error.message);
    }
    if (crmColumnsAvailable !== false) {
      await client
        .from("cms_form_submissions")
        .update({ last_activity_at: now })
        .in("id", [...new Set(entries.map((e) => e.submissionId))]);
    }
    return ((data as ActivityRow[] | null) ?? []).map(rowToActivity);
  }

  await hydrateActivitiesFromDisk();
  const created = entries.map((e, i) => ({
    id: `act-${Date.now()}-${i}`,
    submissionId: e.submissionId,
    kind: e.kind,
    body: e.body ?? null,
    meta: e.meta ?? {},
    actorId: e.actor?.id ?? null,
    actorName: e.actor?.name ?? null,
    createdAt: now,
  }));
  activitiesCache = [...created, ...activitiesCache];
  await writeLocalJsonFile(ACTIVITIES_FILE, activitiesCache);
  return created;
}

/**
 * Best-effort timeline logging for automatic events (status/assign changes).
 * The primary update already succeeded, so a missing table must not fail it.
 */
export async function logFormActivities(entries: NewFormActivity[]) {
  try {
    await addFormActivities(entries);
  } catch (error) {
    console.warn("[forms] activity log skipped:", (error as Error).message);
  }
}

/**
 * Folds duplicates into the primary lead: their timeline moves over, each
 * duplicate is archived and both sides get a merge entry. Nothing is deleted.
 */
export async function mergeFormSubmissions(
  primaryId: string,
  duplicateIds: string[],
  actor: FormActor
): Promise<FormSubmission | null> {
  const duplicates = duplicateIds.filter((id) => id && id !== primaryId);
  const primary = await readFormSubmissionById(primaryId);
  if (!primary || duplicates.length === 0) return primary;

  if (isSupabaseConfigured()) {
    const client = requireWriteClient();
    const { error } = await client
      .from("cms_form_activities")
      .update({ submission_id: primaryId })
      .in("submission_id", duplicates);
    if (error) {
      if (isMissingTable(error)) throw crmSetupError();
      throw new Error(error.message);
    }
  } else {
    await hydrateActivitiesFromDisk();
    const set = new Set(duplicates);
    activitiesCache = activitiesCache.map((a) =>
      set.has(a.submissionId) ? { ...a, submissionId: primaryId } : a
    );
    await writeLocalJsonFile(ACTIVITIES_FILE, activitiesCache);
  }

  await updateFormSubmissions(duplicates, { status: "archived" });
  await addFormActivities([
    {
      submissionId: primaryId,
      kind: "merge",
      meta: { merged: duplicates },
      actor,
    },
    ...duplicates.map((id) => ({
      submissionId: id,
      kind: "merge" as const,
      meta: { mergedInto: primaryId },
      actor,
    })),
  ]);
  return readFormSubmissionById(primaryId);
}
