import type { FormSubmission } from "@/lib/cms/types";
import submissionsData from "@/../data/cms/form-submissions.json";

let cache: FormSubmission[] = [...(submissionsData as FormSubmission[])];

export function getFormSubmissions(type?: FormSubmission["type"]): FormSubmission[] {
  if (!type) return cache;
  return cache.filter((s) => s.type === type);
}

export function updateSubmissionStatus(
  id: string,
  status: FormSubmission["status"]
): FormSubmission | null {
  const idx = cache.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  cache[idx] = { ...cache[idx], status };
  return cache[idx];
}

export function addFormSubmission(
  submission: Omit<FormSubmission, "id" | "createdAt">
): FormSubmission {
  const entry: FormSubmission = {
    ...submission,
    id: `sub-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  cache.unshift(entry);
  return entry;
}
