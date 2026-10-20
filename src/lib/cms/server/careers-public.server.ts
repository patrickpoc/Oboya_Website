import "server-only";

import { cache } from "react";
import { isOpeningPublic, toPublicOpening, type PublicJobOpening } from "@/lib/cms/careers/public";
import { sanitizeRichHtml } from "@/lib/cms/sanitize-rich-html.server";
import { CareersError, careersClient } from "@/lib/cms/server/careers-core.server";
import { readPublishedOpenings } from "@/lib/cms/server/careers-openings.server";
import type { JobOpening } from "@/lib/cms/careers/types";

/** Reads fail closed: the public site shows an empty state instead of crashing. Logs the code only. */
async function readPublic(): Promise<JobOpening[]> {
  try {
    const now = new Date();
    return (await readPublishedOpenings()).filter((o) => isOpeningPublic(o, now));
  } catch (error) {
    console.error("[careers] public read failed", error instanceof CareersError ? error.code : "db_error");
    return [];
  }
}

export const listPublicOpenings = cache(async (locale: string): Promise<PublicJobOpening[]> => {
  const rows = await readPublic();
  return rows
    .sort((a, b) => (b.publishedAt ?? b.createdAt ?? "").localeCompare(a.publishedAt ?? a.createdAt ?? ""))
    .map((o) => toPublicOpening(o, locale, sanitizeRichHtml));
});

export const getPublicOpeningBySlug = cache(
  async (slug: string, locale: string): Promise<PublicJobOpening | null> => {
    const found = (await readPublic()).find((o) => o.slug === slug);
    return found ? toPublicOpening(found, locale, sanitizeRichHtml) : null;
  }
);

type LiveRow = { id: string; slug?: string; status: JobOpening["status"]; publish_at: string | null; close_at: string | null };

const isLive = (row: LiveRow) =>
  isOpeningPublic(
    { status: row.status, publishAt: row.publish_at ?? undefined, closeAt: row.close_at ?? undefined },
    new Date()
  );

/** Uncached lookup for the apply API: the live row decides, never a cached page. DB errors throw 503 (not "closed"). */
export async function getPublicOpeningLive(slug: string): Promise<{ id: string; slug: string } | null> {
  const db = careersClient();
  if (!db) {
    const found = (await readPublic()).find((o) => o.slug === slug);
    return found ? { id: found.id, slug: found.slug } : null;
  }
  const { data, error } = await db
    .from("cms_job_openings")
    .select("id, slug, status, publish_at, close_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new CareersError(503, "unavailable");
  const row = data as LiveRow | null;
  return row && isLive(row) ? { id: row.id, slug: row.slug ?? slug } : null;
}

/** Live check by id (confirm step). DB errors throw 503 `unavailable`, so they never read as `openingClosed`. */
export async function isOpeningIdPublicLive(id: string): Promise<boolean> {
  const db = careersClient();
  if (!db) return (await readPublic()).some((o) => o.id === id);
  const { data, error } = await db
    .from("cms_job_openings")
    .select("id, status, publish_at, close_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new CareersError(503, "unavailable");
  return !!data && isLive(data as LiveRow);
}
