import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FormSubmission } from "@/lib/cms/types";
import {
  addFormSubmission as addToMemory,
  getFormSubmissions as getFromMemory,
  replaceFormSubmissionsCache,
} from "@/lib/cms/repositories/forms-repository";

const FORMS_FILE = path.join(process.cwd(), "data", "cms", "form-submissions.json");

let hydrated = false;

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

export async function readFormSubmissions(
  type?: FormSubmission["type"]
): Promise<FormSubmission[]> {
  await hydrateFromDisk();
  return getFromMemory(type);
}

export async function persistFormSubmissions(submissions: FormSubmission[]) {
  await writeFile(
    FORMS_FILE,
    `${JSON.stringify(submissions, null, 2)}\n`,
    "utf-8"
  );
}

export async function addFormSubmissionDurable(
  submission: Omit<FormSubmission, "id" | "createdAt">
): Promise<FormSubmission> {
  await hydrateFromDisk();
  const entry = addToMemory(submission);
  try {
    await persistFormSubmissions(getFromMemory());
  } catch {
    // Keep in-memory even if disk write fails (e.g. read-only deploy).
  }
  return entry;
}
