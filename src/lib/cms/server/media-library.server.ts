import "server-only";

import type { MediaAsset } from "@/lib/cms/types";
import {
  ensureMediaFolders,
  getMediaAssets,
  replaceMediaAssetsCache,
  saveMediaAsset,
} from "@/lib/cms/repositories/media-repository";
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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cms_media")
    .select(
      "id, name, url, type, mime_type, size, folder, metadata, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load media library");
  }

  return (data as CmsMediaRow[] | null)?.map(rowToAsset) ?? [];
}

/** Site files + Supabase uploads + stock refs for the admin Media Library. */
export async function syncMediaLibraryFromSupabase(): Promise<MediaAsset[]> {
  ensureMediaFolders(SITE_MEDIA_FOLDERS);
  const site = await scanSiteMediaAssets();
  const remote = await readRemoteMedia();
  replaceMediaAssetsCache(remote, site);
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
