import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MediaAsset } from "@/lib/cms/types";
import { saveMediaAsset, deleteMediaAsset } from "@/lib/cms/repositories/media-repository";
import { FOLDER_WEBSITE_FILES } from "@/lib/cms/media-folder-ids";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const MEDIA_BUCKET = "cms-media";

export const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
export const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

export const IMAGE_MAX = 8 * 1024 * 1024;
/** Direct-to-storage limit (Supabase). Serverless body uploads stay smaller. */
export const VIDEO_MAX = 50 * 1024 * 1024;
/** Vercel serverless request body limit — used only for multipart → disk/API path. */
export const SERVERLESS_BODY_MAX = 4 * 1024 * 1024;

export const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export function mediaKind(mime: string): MediaAsset["type"] | null {
  if (IMAGE_TYPES.has(mime)) return "image";
  if (VIDEO_TYPES.has(mime)) return "video";
  return null;
}

export function maxBytesForKind(kind: MediaAsset["type"]) {
  return kind === "video" ? VIDEO_MAX : IMAGE_MAX;
}

export function buildObjectFilename(mime: string) {
  const ext = EXT_BY_MIME[mime] ?? "bin";
  const id = randomUUID();
  const filename = `media-${id}.${ext}`;
  return { id, filename, objectPath: `uploads/${filename}` };
}

export async function createSignedMediaUpload(input: {
  mime: string;
  size: number;
  originalName?: string;
}) {
  const mime = input.mime.toLowerCase();
  const kind = mediaKind(mime);
  if (!kind) {
    throw new Error("Unsupported file type. Use JPEG/PNG/WebP/GIF or MP4/WebM.");
  }

  const max = maxBytesForKind(kind);
  if (input.size > max) {
    throw new Error(
      `File too large. Max ${kind === "video" ? "50MB" : "8MB"}.`
    );
  }

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured for direct uploads.");
  }

  const supabase = await createClient();
  const { id, filename, objectPath } = buildObjectFilename(mime);

  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUploadUrl(objectPath);

  if (error || !data) {
    throw new Error(
      error?.message ||
        `Could not create upload URL. Ensure the "${MEDIA_BUCKET}" storage bucket exists.`
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath);

  return {
    id,
    filename,
    objectPath,
    publicUrl,
    signedUrl: data.signedUrl,
    token: data.token,
    kind,
    mimeType: mime,
    size: input.size,
    originalName: input.originalName || filename,
  };
}

export async function registerMediaAsset(input: {
  id: string;
  name: string;
  url: string;
  type: MediaAsset["type"];
  mimeType: string;
  size: number;
  folder?: string;
}) {
  const now = new Date().toISOString();
  const folder = input.folder || FOLDER_WEBSITE_FILES;
  const asset: MediaAsset = {
    id: input.id,
    name: input.name,
    url: input.url,
    type: input.type,
    mimeType: input.mimeType,
    size: input.size,
    folder,
    tags: input.type === "video" ? ["video", "upload"] : ["upload"],
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseConfigured()) {
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
      created_at: asset.createdAt,
      updated_at: asset.updatedAt,
    });

    if (error) {
      throw new Error(
        error.message || "Failed to save media asset to the database"
      );
    }
  }

  return saveMediaAsset(asset);
}

export async function storeMediaLocally(input: {
  file: File;
  mime: string;
  kind: MediaAsset["type"];
  folder?: string;
}) {
  if (input.file.size > SERVERLESS_BODY_MAX) {
    throw new Error(
      "File too large for local upload path. Configure Supabase Storage or use a file under 4MB."
    );
  }

  const { id, filename } = buildObjectFilename(input.mime);
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(await input.file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  return registerMediaAsset({
    id,
    name: input.file.name || filename,
    url: `/uploads/${filename}`,
    type: input.kind,
    mimeType: input.mime,
    size: input.file.size,
    folder: input.folder,
  });
}

export async function storeMediaViaSupabaseServer(input: {
  file: File;
  mime: string;
  kind: MediaAsset["type"];
  folder?: string;
}) {
  // Keep under platform body limits when proxying through the Next.js route.
  if (input.file.size > SERVERLESS_BODY_MAX) {
    throw new Error(
      "File too large for server upload. Use direct storage upload (retry) or keep under 4MB."
    );
  }

  const supabase = await createClient();
  const { id, filename, objectPath } = buildObjectFilename(input.mime);
  const buffer = Buffer.from(await input.file.arrayBuffer());

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(objectPath, buffer, {
      contentType: input.mime,
      upsert: false,
    });

  if (error) {
    throw new Error(
      error.message ||
        `Upload failed. Ensure the "${MEDIA_BUCKET}" storage bucket exists.`
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath);

  return registerMediaAsset({
    id,
    name: input.file.name || filename,
    url: publicUrl,
    type: input.kind,
    mimeType: input.mime,
    size: input.file.size,
    folder: input.folder,
  });
}

function storagePathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${MEDIA_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx >= 0) {
    return decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
  }
  if (url.startsWith("/uploads/")) {
    return url.replace(/^\//, "");
  }
  return null;
}

export async function removeMediaAsset(input: {
  id: string;
  url?: string;
}): Promise<boolean> {
  const removed = deleteMediaAsset(input.id);

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from("cms_media")
      .delete()
      .eq("id", input.id);

    if (dbError) {
      throw new Error(dbError.message || "Failed to delete media from database");
    }

    const objectPath = input.url ? storagePathFromPublicUrl(input.url) : null;
    if (objectPath?.startsWith("uploads/")) {
      const { error: storageError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .remove([objectPath]);
      if (storageError) {
        console.error("Supabase storage delete failed:", storageError.message);
      }
    }
    return true;
  }

  if (input.url?.startsWith("/uploads/")) {
    try {
      const { unlink } = await import("node:fs/promises");
      await unlink(path.join(process.cwd(), "public", input.url.replace(/^\//, "")));
    } catch {
      // File may already be gone.
    }
  }

  return removed;
}
