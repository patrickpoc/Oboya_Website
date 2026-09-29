import "server-only";

import type { FormActivityKind, FormSubmission, FormSubmissionPatch } from "@/lib/cms/types";
import { isSubmissionStatus, normalizePriority, normalizeTags } from "@/lib/cms/forms/crm";
import {
  addFormActivities,
  logFormActivities,
  type FormActor,
  type NewFormActivity,
  updateFormSubmissions,
} from "@/lib/cms/server/forms.server";

export function parseFormPatch(body: Record<string, unknown>): FormSubmissionPatch | null {
  const patch: FormSubmissionPatch = {};
  if (typeof body.status === "string") {
    if (!isSubmissionStatus(body.status)) return null;
    patch.status = body.status;
  }
  if ("assigneeId" in body) {
    patch.assigneeId = body.assigneeId ? String(body.assigneeId) : null;
    patch.assigneeName = body.assigneeName ? String(body.assigneeName) : null;
  }
  if ("tags" in body) patch.tags = normalizeTags(body.tags);
  if (typeof body.priority === "string") patch.priority = normalizePriority(body.priority);
  if (typeof body.read === "boolean") patch.read = body.read;
  if (Object.keys(patch).length === 0) return null;
  return patch;
}

function activitiesForPatch(
  before: FormSubmission,
  after: FormSubmission,
  patch: FormSubmissionPatch,
  actor: FormActor
): NewFormActivity[] {
  const items: NewFormActivity[] = [];
  const base = { submissionId: after.id, actor };
  if (patch.status && before.status !== after.status) {
    items.push({
      ...base,
      kind: "status" as FormActivityKind,
      meta: { from: before.status, to: after.status },
    });
  }
  if (patch.assigneeId !== undefined && before.assigneeId !== after.assigneeId) {
    items.push({
      ...base,
      kind: "assign",
      meta: { from: before.assigneeName, to: after.assigneeName },
    });
  }
  if (patch.tags && (before.tags ?? []).join("|") !== (after.tags ?? []).join("|")) {
    items.push({ ...base, kind: "tags", meta: { tags: after.tags } });
  }
  if (patch.priority && before.priority !== after.priority) {
    items.push({
      ...base,
      kind: "priority",
      meta: { from: before.priority, to: after.priority },
    });
  }
  return items;
}

export async function applyFormPatch(
  ids: string[],
  patch: FormSubmissionPatch,
  actor: FormActor,
  current: FormSubmission[]
): Promise<FormSubmission[]> {
  const updated = await updateFormSubmissions(ids, patch);
  const byId = new Map(current.map((s) => [s.id, s]));
  const logs = updated.flatMap((after) => {
    const before = byId.get(after.id);
    if (!before) return [];
    return activitiesForPatch(before, after, patch, actor);
  });
  if (logs.length) await logFormActivities(logs);
  return updated;
}

export async function addNoteActivity(
  submissionId: string,
  body: string,
  actor: FormActor
) {
  const [activity] = await addFormActivities([
    { submissionId, kind: "note", body, actor },
  ]);
  return activity;
}
