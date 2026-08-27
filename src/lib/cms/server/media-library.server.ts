import "server-only";

import type { MediaAsset } from "@/lib/cms/types";
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
  SITE_MEDIA_FOLDERS,
  scanSiteMediaAssets,
} from "@/lib/cms/server/site-media.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

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
    folder: row.folder || "folder-uploads",
    tags: Array.isArray(row.metadata?.tags) ? row.metadata.tags : ["upload"],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
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

/**
 * Media Library = assets actually wired into site/CMS elements
 * (+ CMS uploads so newly added files remain pickable).
 * Unused files under public/assets and stock fillers are omitted.
 */
export async function syncMediaLibraryFromSupabase(): Promise<MediaAsset[]> {
  ensureMediaFolders(SITE_MEDIA_FOLDERS);

  const inUse = await collectInUseMediaUrls();
  const scanned = await scanSiteMediaAssets();
  const site = scanned.filter((asset) => isUrlInUse(asset.url, inUse));

  const remote = await readRemoteMedia();
  // Keep uploads always; remote stock-like rows only if referenced.
  const remoteKept = remote.filter(
    (asset) =>
      asset.url.includes("/uploads/") ||
      asset.url.includes("cms-media") ||
      asset.tags.includes("upload") ||
      isUrlInUse(asset.url, inUse)
  );

  const have = new Set(
    [...site, ...remoteKept].map((a) => normalizeMediaUrl(a.url))
  );
  const synthesized = assetsFromInUseUrls(inUse, have);

  replaceMediaAssetsCache([...remoteKept, ...synthesized], site);
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
