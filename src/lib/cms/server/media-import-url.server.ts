import "server-only";

import { createHash } from "node:crypto";
import path from "node:path";
import { FOLDER_ECOVASO_PRODUCTS } from "@/lib/cms/media-folder-ids";
import { rowToAsset } from "@/lib/cms/server/media-library.server";
import {
  mediaSupabase,
  storeMediaLocally,
  storeMediaViaSupabaseServer,
} from "@/lib/cms/server/media-upload.server";
import { fetchRemoteImage, type RemoteImageDeps } from "@/lib/security/safe-remote-image";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Tag on every library asset created by an import-by-URL; use it to find and delete test imports. */
export const IMPORTED_FROM_URL_TAG = "imported-from-url";

/** Imports allowed per rolling hour across all admins (a brake on runaway loops, not a quota). */
export const IMPORT_BRAKE_MAX_PER_HOUR = 300;
const BRAKE_WINDOW_MS = 60 * 60 * 1000;

export class ImportBrakeError extends Error {
  constructor() {
    super("Too many images were imported recently. Wait a few minutes and try again.");
    this.name = "ImportBrakeError";
  }
}

/** Tag that records which source URL an asset came from, so a repeat import reuses it. */
export function sourceUrlTag(url: string) {
  let key = url.trim();
  try {
    const parsed = new URL(key);
    parsed.hash = "";
    key = parsed.href;
  } catch {
    // Keep the trimmed text; the fetch rejects it anyway.
  }
  return `src:${createHash("sha256").update(key).digest("hex").slice(0, 24)}`;
}

const MEDIA_COLUMNS = "id, name, url, type, mime_type, size, folder, metadata, created_at, updated_at";

/**
 * Previously imported asset for this source URL, or null. Best effort: a failed lookup
 * simply imports again.
 */
export async function findImportedAsset(sourceTag: string) {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await mediaSupabase();
    const { data, error } = await supabase
      .from("cms_media")
      .select(MEDIA_COLUMNS)
      .contains("metadata", { tags: [sourceTag] })
      .limit(1);
    if (error || !data?.length) return null;
    return rowToAsset(data[0] as Parameters<typeof rowToAsset>[0]);
  } catch {
    return null;
  }
}

/** Throws ImportBrakeError when too many imports landed in the last hour. Fails open on errors. */
export async function assertImportBrake(now = Date.now()) {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = await mediaSupabase();
    const { count, error } = await supabase
      .from("cms_media")
      .select("id", { count: "exact", head: true })
      .contains("metadata", { tags: [IMPORTED_FROM_URL_TAG] })
      .gte("created_at", new Date(now - BRAKE_WINDOW_MS).toISOString());
    if (!error && (count ?? 0) >= IMPORT_BRAKE_MAX_PER_HOUR) throw new ImportBrakeError();
  } catch (error) {
    if (error instanceof ImportBrakeError) throw error;
  }
}

function nameFromUrl(finalUrl: string, mime: string) {
  const ext = mime.split("/")[1] ?? "img";
  try {
    const base = path.basename(new URL(finalUrl).pathname).replace(/[^\w.-]+/g, "-").slice(0, 80);
    return base && base !== "-" ? base : `imported.${ext}`;
  } catch {
    return `imported.${ext}`;
  }
}

/** Downloads a public https image (SSRF-guarded) and stores it in the media library. */
export async function importRemoteImageToLibrary(
  url: string,
  options: { folder?: string; deps?: RemoteImageDeps } = {}
) {
  const sourceTag = sourceUrlTag(url);
  const existing = await findImportedAsset(sourceTag);
  if (existing) return { ...existing, reused: true as const };
  await assertImportBrake();

  const image = await fetchRemoteImage(url, options.deps);
  const file = new File([new Uint8Array(image.buffer)], nameFromUrl(image.finalUrl, image.mime), {
    type: image.mime,
  });
  const input = {
    file,
    mime: image.mime,
    kind: "image" as const,
    folder: options.folder ?? FOLDER_ECOVASO_PRODUCTS,
    tags: ["upload", IMPORTED_FROM_URL_TAG, sourceTag],
  };
  return isSupabaseConfigured() ? storeMediaViaSupabaseServer(input) : storeMediaLocally(input);
}
