import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { MediaFolder } from "@/lib/cms/types";
import {
  getDefaultMediaFolders,
  getMediaFolders,
  replaceMediaFoldersCache,
} from "@/lib/cms/repositories/media-repository";
import { LEGACY_WEBSITE_FOLDER_IDS } from "@/lib/cms/media-folder-ids";
import { writeLocalJsonFile } from "@/lib/cms/server/local-fs.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient, createPublicClient } from "@/lib/supabase/server";

export const MEDIA_FOLDERS_DOC_ID = "media-folders";

const FOLDERS_FILE = path.join(
  process.cwd(),
  "data",
  "cms",
  "media-folders.json"
);

function isFolderArray(value: unknown): value is MediaFolder[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as MediaFolder).id === "string" &&
        typeof (item as MediaFolder).name === "string"
    )
  );
}

function mergeWithDefaults(stored: MediaFolder[]): MediaFolder[] {
  const byId = new Map(
    stored
      .filter((f) => !LEGACY_WEBSITE_FOLDER_IDS.includes(f.id as (typeof LEGACY_WEBSITE_FOLDER_IDS)[number]))
      .map((f) => [f.id, f])
  );
  for (const folder of getDefaultMediaFolders()) {
    byId.set(folder.id, byId.get(folder.id) ?? folder);
  }
  // Keep any custom user-created folders that aren't legacy.
  for (const folder of stored) {
    if (
      !byId.has(folder.id) &&
      !LEGACY_WEBSITE_FOLDER_IDS.includes(
        folder.id as (typeof LEGACY_WEBSITE_FOLDER_IDS)[number]
      )
    ) {
      byId.set(folder.id, folder);
    }
  }
  return Array.from(byId.values());
}

async function readFoldersFromSupabase(): Promise<MediaFolder[] | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("cms_documents")
    .select("data")
    .eq("id", MEDIA_FOLDERS_DOC_ID)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(error.message);

  const doc = data?.data as { folders?: unknown } | unknown;
  if (!doc || typeof doc !== "object") return null;
  const folders = (doc as { folders?: unknown }).folders;
  if (!isFolderArray(folders)) return null;
  return folders;
}

async function writeFoldersToSupabase(folders: MediaFolder[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("cms_documents").upsert({
    id: MEDIA_FOLDERS_DOC_ID,
    module: "media",
    data: { folders },
    status: "published",
    updated_at: new Date().toISOString(),
  });
  if (error) {
    throw new Error(error.message || "Failed to save media folders");
  }
}

async function readFoldersFromDisk(): Promise<MediaFolder[] | null> {
  try {
    const raw = await readFile(FOLDERS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as { folders?: unknown };
    if (!isFolderArray(parsed.folders)) return null;
    return parsed.folders;
  } catch {
    return null;
  }
}

async function writeFoldersToDisk(folders: MediaFolder[]) {
  await writeLocalJsonFile(FOLDERS_FILE, { folders });
}

export async function readMediaFoldersDurable(): Promise<MediaFolder[]> {
  if (isSupabaseConfigured()) {
    try {
      const remote = await readFoldersFromSupabase();
      if (remote) {
        const merged = mergeWithDefaults(remote);
        replaceMediaFoldersCache(merged);
        return getMediaFolders();
      }
    } catch (error) {
      console.error(
        "Supabase media folders read failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  const local = await readFoldersFromDisk();
  const merged = mergeWithDefaults(local ?? getDefaultMediaFolders());
  replaceMediaFoldersCache(merged);
  return getMediaFolders();
}

export async function saveMediaFoldersDurable(
  folders: MediaFolder[]
): Promise<MediaFolder[]> {
  const merged = mergeWithDefaults(folders);
  replaceMediaFoldersCache(merged);

  if (isSupabaseConfigured()) {
    await writeFoldersToSupabase(merged);
    return getMediaFolders();
  }

  await writeFoldersToDisk(merged);
  return getMediaFolders();
}
