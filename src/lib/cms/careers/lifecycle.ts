import { slugify } from "@/lib/cms/slugify";
import type { JobOpening, OpeningStatus } from "./types";

export type OpeningAction = "publish" | "close" | "reopen" | "archive";

const TRANSITIONS: Record<OpeningAction, { from: OpeningStatus[]; to: OpeningStatus }> = {
  publish: { from: ["draft"], to: "published" },
  close: { from: ["published"], to: "closed" },
  reopen: { from: ["closed", "archived"], to: "published" },
  archive: { from: ["draft", "published", "closed"], to: "archived" },
};

/** Target status for the action, or null when it is not allowed from `current`. */
export function nextOpeningStatus(action: OpeningAction, current: OpeningStatus): OpeningStatus | null {
  const rule = TRANSITIONS[action];
  return rule && rule.from.includes(current) ? rule.to : null;
}

/** Applies a status change and stamps published_at / closed_at like the server does. */
export function applyOpeningAction(
  opening: JobOpening,
  action: OpeningAction,
  now = new Date().toISOString()
): JobOpening | null {
  const status = nextOpeningStatus(action, opening.status);
  if (!status) return null;
  const next: JobOpening = { ...opening, status, updatedAt: now };
  if (status === "published") {
    next.publishedAt = opening.publishedAt ?? now;
    next.closedAt = undefined;
  }
  if (status === "closed") next.closedAt = now;
  return next;
}

export function duplicateOpening(
  source: JobOpening,
  id: string,
  existingSlugs: string[] = [],
  now = new Date().toISOString()
): JobOpening {
  const taken = new Set(existingSlugs);
  const base = `${slugify(source.slug).slice(0, 112)}-copy`;
  let slug = base;
  for (let i = 2; taken.has(slug); i += 1) slug = `${base}-${i}`;
  return {
    ...source,
    id,
    slug,
    status: "draft",
    publishAt: undefined,
    closeAt: undefined,
    publishedAt: undefined,
    closedAt: undefined,
    createdBy: undefined,
    updatedBy: undefined,
    createdAt: now,
    updatedAt: now,
  };
}
