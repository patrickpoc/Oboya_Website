import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FormSubmission, FormSubmissionStatus } from "@/lib/cms/types";
import {
  addFormSubmission as addToMemory,
  getFormSubmissions as getFromMemory,
  replaceFormSubmissionsCache,
  updateSubmissionStatus as updateStatusMemory,
} from "@/lib/cms/repositories/forms-repository";
import { writeLocalJsonFile } from "@/lib/cms/server/local-fs.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient, createPublicClient } from "@/lib/supabase/server";
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

async function readFormsFromSupabase(): Promise<FormSubmission[]> {
  let client = createPublicClient();
  try {
    client = await createClient();
  } catch {
    /* public client fallback */
  }

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
    const client = writeClient() ?? (await createClient());
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
    const client = writeClient() ?? (await createClient());
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
