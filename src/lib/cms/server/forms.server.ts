import "server-only";

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { FormSubmission, FormSubmissionStatus } from "@/lib/cms/types";
import {
  addFormSubmission as addToMemory,
  getFormSubmissions as getFromMemory,
  replaceFormSubmissionsCache,
  updateSubmissionStatus as updateStatusMemory,
} from "@/lib/cms/repositories/forms-repository";
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

async function persistFormSubmissions(submissions: FormSubmission[]) {
  await mkdir(path.dirname(FORMS_FILE), { recursive: true });
  await writeFile(
    FORMS_FILE,
    `${JSON.stringify(submissions, null, 2)}\n`,
    "utf-8"
  );
}

async function readFormsFromSupabase(): Promise<FormSubmission[] | null> {
  const supabase = createPublicClient();
  // Prefer authenticated client when available for RLS.
  let client = supabase;
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
  if (!data) return [];
  return (data as FormRow[]).map(rowToSubmission);
}

function writeClient() {
  if (isServiceRoleConfigured()) return createServiceClient();
  return null;
}

export async function readFormSubmissions(
  type?: FormSubmission["type"]
): Promise<FormSubmission[]> {
  if (isSupabaseConfigured()) {
    try {
      const remote = await readFormsFromSupabase();
      if (remote) {
        replaceFormSubmissionsCache(remote);
        hydrated = true;
        return type ? remote.filter((s) => s.type === type) : remote;
      }
    } catch (error) {
      console.error(
        "cms_form_submissions read failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  await hydrateFromDisk();
  return getFromMemory(type);
}

export async function addFormSubmissionDurable(
  submission: Omit<FormSubmission, "id" | "createdAt">
): Promise<FormSubmission> {
  if (isSupabaseConfigured()) {
    try {
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
    } catch (error) {
      console.error(
        "cms_form_submissions insert failed:",
        error instanceof Error ? error.message : error
      );
      // Fall through to disk/memory.
    }
  }

  await hydrateFromDisk();
  const entry = addToMemory(submission);
  try {
    await persistFormSubmissions(getFromMemory());
  } catch {
    // Keep in-memory even if disk write fails (e.g. read-only deploy).
  }
  return entry;
}

export async function updateFormSubmissionStatusDurable(
  id: string,
  status: FormSubmissionStatus
): Promise<FormSubmission | null> {
  if (isSupabaseConfigured()) {
    try {
      const client = writeClient() ?? (await createClient());
      const { data, error } = await client
        .from("cms_form_submissions")
        .update({ status })
        .eq("id", id)
        .select("id, type, status, data, created_at")
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (data) {
        const entry = rowToSubmission(data as FormRow);
        updateStatusMemory(id, status);
        return entry;
      }
    } catch (error) {
      console.error(
        "cms_form_submissions status update failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  await hydrateFromDisk();
  const updated = updateStatusMemory(id, status);
  if (updated) {
    try {
      await persistFormSubmissions(getFromMemory());
    } catch {
      /* keep memory */
    }
  }
  return updated;
}
