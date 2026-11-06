import "server-only";

import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { cmsDocumentFilePath } from "@/lib/cms/server/cms-document.server";
import { rethrowNextSignals } from "@/lib/cms/server/rethrow-next-signals";
import { noStoreHeaders } from "@/lib/security/http-cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * A read that a save depends on failed. The message is generic on purpose:
 * the detail is logged, never returned to clients.
 */
export class CmsReadError extends Error {
  constructor(detail?: unknown) {
    super("Could not read the current data");
    this.name = "CmsReadError";
    if (detail !== undefined) {
      console.error(
        "CmsReadError:",
        detail instanceof Error ? detail.message : detail
      );
    }
  }
}

/** `?forEdit=1`: the caller wants a save baseline, not a display read. */
export function isEditRead(request: Request): boolean {
  return new URL(request.url).searchParams.get("forEdit") === "1";
}

export function readFailureResponse(_error?: unknown) {
  return NextResponse.json(
    { error: "Could not read the current data" },
    { status: 503, headers: noStoreHeaders }
  );
}

/**
 * Save baseline: authenticated client, never cached. Returns null only for a
 * confirmed-absent row; every other problem throws `CmsReadError`.
 */
export async function readCmsDocumentStrict(docId: string): Promise<unknown | null> {
  if (!isSupabaseConfigured()) {
    let raw: string;
    try {
      raw = await readFile(cmsDocumentFilePath(docId), "utf-8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return null;
      throw new CmsReadError(error);
    }
    try {
      return JSON.parse(raw) as unknown;
    } catch (error) {
      throw new CmsReadError(error);
    }
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cms_documents")
      .select("data, status")
      .eq("id", docId)
      .maybeSingle();
    if (error) throw new CmsReadError(`${docId}: ${error.message}`);
    if (!data) return null;
    if (data.status !== "published" || data.data == null) {
      throw new CmsReadError(`${docId}: row exists but is not readable (${data.status})`);
    }
    return data.data;
  } catch (error) {
    rethrowNextSignals(error);
    if (error instanceof CmsReadError) throw error;
    throw new CmsReadError(error);
  }
}

/**
 * Strict read plus a shape check: null for a confirmed-absent row, the
 * validated document otherwise, `CmsReadError` when it is malformed.
 */
export async function readCmsDocumentChecked<T>(
  docId: string,
  isShape: (value: unknown) => value is T
): Promise<T | null> {
  const raw = await readCmsDocumentStrict(docId);
  if (raw == null) return null;
  if (!isShape(raw)) throw new CmsReadError(`${docId}: document is malformed`);
  return raw;
}
