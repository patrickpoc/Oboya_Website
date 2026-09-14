import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FormSubmission, FormSubmissionStatus } from "@/lib/cms/types";
import {
  addFormSubmission as addToMemory,
  anonymizeFormSubmission as anonymizeMemory,
  deleteFormSubmission as deleteMemory,
  getFormSubmissions as getFromMemory,
  replaceFormSubmissionsCache,
  updateSubmissionStatus as updateStatusMemory,
} from "@/lib/cms/repositories/forms-repository";
import { writeLocalJsonFile } from "@/lib/cms/server/local-fs.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

const FORMS_FILE = path.join(process.cwd(), "data", "cms", "form-submissions.json");

let hydrated = false;

type FormRow = {
  id: string;
  type: string;
  status: string;
  data: Record<string, unknown>;
  created_at: string;
};

function rowToSubmission(row: FormRow): FormSubmission {
  return {
    id: row.id,
    type: row.type as FormSubmission["type"],
    status: row.status as FormSubmissionStatus,
    data: row.data ?? {},
    createdAt: row.created_at,
  };
}

async function hydrateFromDisk() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await readFile(FORMS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as FormSubmission[];
    if (Array.isArray(parsed)) {
      replaceFormSubmissionsCache(parsed);
    }
  } catch {
    // Keep module seed when file is missing.
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

async function readFormsFromSupabase(): Promise<FormSubmission[]> {
  const client = requireWriteClient();

  const { data, error } = await client
    .from("cms_form_submissions")
    .select("id, type, status, data, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data as FormRow[] | null) ?? []).map(rowToSubmission);
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
      .select("id, type, status, data, created_at")
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

export async function updateFormSubmissionStatusDurable(
  id: string,
  status: FormSubmissionStatus
): Promise<FormSubmission | null> {
  if (isSupabaseConfigured()) {
    const client = requireWriteClient();
    const { data, error } = await client
      .from("cms_form_submissions")
      .update({ status })
      .eq("id", id)
      .select("id, type, status, data, created_at")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    const entry = rowToSubmission(data as FormRow);
    updateStatusMemory(id, status);
    return entry;
  }

  await hydrateFromDisk();
  const updated = updateStatusMemory(id, status);
  if (updated) {
    await writeLocalJsonFile(FORMS_FILE, getFromMemory());
  }
  return updated;
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
  if (ok) await writeLocalJsonFile(FORMS_FILE, getFromMemory());
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
      .select("id, type, status, data, created_at")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const entry = rowToSubmission(data as FormRow);
    anonymizeMemory(id);
    return entry;
  }
  await hydrateFromDisk();
  const updated = anonymizeMemory(id);
  if (updated) await writeLocalJsonFile(FORMS_FILE, getFromMemory());
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
