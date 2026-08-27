import "server-only";

import type { MediaAsset } from "@/lib/cms/types";
import {
  FOLDER_ECOVASO_PRODUCTS,
  FOLDER_WEBSITE_FILES,
} from "@/lib/cms/media-folder-ids";
import {
  ensureMediaFolders,
  getMediaAssets,
  replaceMediaAssetsCache,
  saveMediaAsset,
} from "@/lib/cms/repositories/media-repository";
import {
  assetsFromInUseUrls,
  collectInUseMediaUrls,
  isUrlInUse,
  normalizeMediaUrl,
} from "@/lib/cms/server/in-use-media.server";
import {
  readMediaFoldersDurable,
  saveMediaFoldersDurable,
} from "@/lib/cms/server/media-folders.server";
import {
  SITE_MEDIA_FOLDERS,
  scanSiteMediaAssets,
} from "@/lib/cms/server/site-media.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Unused uploads older than this are hidden from the library. */
const RECENT_UPLOAD_MS = 90 * 24 * 60 * 60 * 1000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CmsMediaRow = {
  id: string;
  name: string;
  url: string;
  type: string;
  mime_type: string;
  size: number | string | null;
  folder: string | null;
  metadata: { tags?: string[] } | null;
  created_at: string | null;
  updated_at: string | null;
};

function rowToAsset(row: CmsMediaRow): MediaAsset {
  const type =
    row.type === "video" || row.type === "document" || row.type === "image"
      ? row.type
      : "image";

  return {
    id: row.id,
    name: row.name,
    url: row.url,
    type,
    mimeType: row.mime_type,
    size: Number(row.size) || 0,
    folder: row.folder || FOLDER_WEBSITE_FILES,
    tags: Array.isArray(row.metadata?.tags) ? row.metadata.tags : ["upload"],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function isUploadAsset(asset: MediaAsset): boolean {
  return (
    asset.tags.includes("upload") ||
    asset.url.includes("/uploads/") ||
    asset.url.includes("cms-media") ||
    UUID_RE.test(asset.id)
  );
}

function isRecentUpload(asset: MediaAsset, now = Date.now()): boolean {
  if (!isUploadAsset(asset)) return false;
  const created = Date.parse(asset.createdAt || asset.updatedAt || "");
  if (!Number.isFinite(created)) return true;
  return now - created <= RECENT_UPLOAD_MS;
}

/** Assign Website Files vs Ecovaso Products per current library rules. */
export function assignCanonicalFolder(asset: MediaAsset, now = Date.now()): string {
  // Preserve intentional placements (editables → Website Files, products → Ecovaso).
  if (
    asset.folder === FOLDER_WEBSITE_FILES ||
    asset.folder === FOLDER_ECOVASO_PRODUCTS
  ) {
    return asset.folder;
  }
  // One-time migrate: recent uploads land in Ecovaso Products.
  if (isRecentUpload(asset, now) && isUploadAsset(asset)) {
    return FOLDER_ECOVASO_PRODUCTS;
  }
  return FOLDER_WEBSITE_FILES;
}

async function readRemoteMedia(): Promise<MediaAsset[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cms_media")
      .select(
        "id, name, url, type, mime_type, size, folder, metadata, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("cms_media load skipped:", error.message);
      return [];
    }

    return (data as CmsMediaRow[] | null)?.map(rowToAsset) ?? [];
  } catch (error) {
    console.error(
      "cms_media load skipped:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

async function persistFolderIfChanged(asset: MediaAsset, folder: string) {
  if (asset.folder === folder) return asset;
  const next = {
    ...asset,
    folder,
    updatedAt: new Date().toISOString(),
  };
  if (!UUID_RE.test(asset.id) || !isSupabaseConfigured()) {
    return next;
  }
  try {
    await persistMediaAssetRow(next);
  } catch (error) {
    console.error(
      "media folder migrate skipped:",
      error instanceof Error ? error.message : error
    );
  }
  return next;
}

/**
 * Media Library shows only:
 * - assets currently referenced by site/CMS content, and
 * - uploads that are recent (or still in use).
 * Folders: Website Files (site/editables) + Products/Ecovaso Products (recent uploads).
 */
export async function syncMediaLibraryFromSupabase(): Promise<MediaAsset[]> {
  ensureMediaFolders(SITE_MEDIA_FOLDERS);
  try {
    const folders = await readMediaFoldersDurable();
    await saveMediaFoldersDurable(folders);
  } catch (error) {
    console.error("media folders sync skipped:", error);
  }

  let inUse = new Set<string>();
  try {
    inUse = await collectInUseMediaUrls();
  } catch (error) {
    console.error("collectInUseMediaUrls failed:", error);
  }

  let siteInUse: MediaAsset[] = [];
  try {
    const scanned = await scanSiteMediaAssets();
    siteInUse = scanned.filter((asset) => isUrlInUse(asset.url, inUse));
  } catch (error) {
    console.error("scanSiteMediaAssets failed:", error);
  }

  let remote: MediaAsset[] = [];
  try {
    remote = await readRemoteMedia();
  } catch (error) {
    console.error("readRemoteMedia failed:", error);
  }

  const now = Date.now();
  const remoteKept = remote.filter(
    (asset) => isUrlInUse(asset.url, inUse) || isRecentUpload(asset, now)
  );

  const have = new Set(
    [...siteInUse, ...remoteKept].map((a) => normalizeMediaUrl(a.url))
  );
  const synthesized = assetsFromInUseUrls(inUse, have);

  const relocatedSite = await Promise.all(
    siteInUse.map((asset) =>
      persistFolderIfChanged(asset, assignCanonicalFolder(asset, now))
    )
  );
  const relocatedRemote = await Promise.all(
    remoteKept.map((asset) =>
      persistFolderIfChanged(asset, assignCanonicalFolder(asset, now))
    )
  );
  const relocatedSynth = synthesized.map((asset) => ({
    ...asset,
    folder: FOLDER_WEBSITE_FILES,
  }));

  replaceMediaAssetsCache(
    [...relocatedRemote, ...relocatedSynth],
    relocatedSite
  );
  return getMediaAssets();
}

export async function persistMediaAssetRow(asset: MediaAsset): Promise<void> {
  if (!isSupabaseConfigured()) {
    saveMediaAsset(asset);
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cms_media").upsert({
    id: asset.id,
    name: asset.name,
    url: asset.url,
    type: asset.type,
    mime_type: asset.mimeType,
    size: asset.size,
    folder: asset.folder,
    metadata: { tags: asset.tags },
    updated_at: asset.updatedAt,
    created_at: asset.createdAt,
  });

  if (error) {
    throw new Error(error.message || "Failed to save media asset to database");
  }

  saveMediaAsset(asset);
}
