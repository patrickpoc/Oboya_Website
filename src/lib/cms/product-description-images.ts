import type { LocalizedString } from "@/lib/cms/types";
import { FOLDER_PRODUCT_DESCRIPTIONS } from "@/lib/cms/media-folder-ids";
import { getMediaAssets } from "@/lib/cms/repositories/media-repository";
import { removeMediaAsset } from "@/lib/cms/server/media-upload.server";
import { syncMediaLibraryFromSupabase } from "@/lib/cms/server/media-library.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const IMG_SRC_RE = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;

export function extractImageUrlsFromHtml(html: string): string[] {
  if (!html.trim()) return [];
  const urls = new Set<string>();
  let match: RegExpExecArray | null;
  const re = new RegExp(IMG_SRC_RE.source, IMG_SRC_RE.flags);
  while ((match = re.exec(html)) !== null) {
    const url = match[1]?.trim();
    if (url) urls.add(url);
  }
  return Array.from(urls);
}

export function extractDescriptionImageUrls(description: LocalizedString): string[] {
  const urls = new Set<string>();
  for (const locale of Object.keys(description) as Array<keyof LocalizedString>) {
    for (const url of extractImageUrlsFromHtml(description[locale] ?? "")) {
      urls.add(url);
    }
  }
  return Array.from(urls);
}

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url, "http://local");
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
}

async function loadDescriptionAssets() {
  if (isSupabaseConfigured()) {
    const assets = await syncMediaLibraryFromSupabase();
    return assets.filter((asset) => asset.folder === FOLDER_PRODUCT_DESCRIPTIONS);
  }
  return getMediaAssets().filter((asset) => asset.folder === FOLDER_PRODUCT_DESCRIPTIONS);
}

export async function reconcileDescriptionImages(params: {
  previous: LocalizedString;
  next: LocalizedString;
}) {
  const previousUrls = new Set(extractDescriptionImageUrls(params.previous));
  const nextUrls = new Set(extractDescriptionImageUrls(params.next));
  const removedUrls = Array.from(previousUrls).filter((url) => !nextUrls.has(url));
  if (removedUrls.length === 0) return;

  const descriptionAssets = await loadDescriptionAssets();
  const removedNormalized = new Set(removedUrls.map(normalizeUrl));

  for (const asset of descriptionAssets) {
    if (!removedNormalized.has(normalizeUrl(asset.url))) continue;
    try {
      await removeMediaAsset({ id: asset.id, url: asset.url });
    } catch (error) {
      console.error("Failed to remove orphaned description image:", asset.url, error);
    }
  }
}
