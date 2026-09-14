import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { MediaAsset } from "@/lib/cms/types";
import { saveMediaAsset, deleteMediaAsset } from "@/lib/cms/repositories/media-repository";
import { FOLDER_WEBSITE_FILES } from "@/lib/cms/media-folder-ids";
import { assertLocalDiskWritable } from "@/lib/cms/server/local-fs.server";
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

const MEDIA_OBJECT_RE = /^uploads\/media-[0-9a-f-]{36}\.[a-z0-9]+$/i;

function uploadsRoot() {
  return path.resolve(process.cwd(), "public", "uploads");
}

function resolveLocalUploadPath(filename: string) {
  const safeName = path.basename(filename);
  const resolved = path.resolve(uploadsRoot(), safeName);
  if (!resolved.startsWith(`${uploadsRoot()}${path.sep}`)) {
    throw new Error("Invalid media path");
  }
  return resolved;
}

export function isAllowedCompletedMediaUrl(url: string, id: string): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url.startsWith("/uploads/")) {
    const filename = path.basename(url);
    return MEDIA_OBJECT_RE.test(`uploads/${filename}`) && filename.includes(id);
  }
  try {
    const parsed = new URL(url);
    if (supabaseUrl) {
      const expectedHost = new URL(supabaseUrl).hostname;
      if (parsed.hostname !== expectedHost) return false;
    } else if (!parsed.hostname.endsWith(".supabase.co")) {
      return false;
    }
    const marker = `/object/public/${MEDIA_BUCKET}/`;
    const idx = parsed.pathname.indexOf(marker);
    if (idx < 0) return false;
    const objectPath = decodeURIComponent(parsed.pathname.slice(idx + marker.length));
    return MEDIA_OBJECT_RE.test(objectPath) && objectPath.includes(`media-${id}.`);
  } catch {
    return false;
  }
}

async function stripImageMetadata(
  buffer: Buffer,
  mime: string
): Promise<{ buffer: Buffer; mime: string }> {
  if (!IMAGE_TYPES.has(mime) || mime === "image/gif") {
    return { buffer, mime };
  }
  if (mime === "image/png") {
    return { buffer: await sharp(buffer).rotate().png().toBuffer(), mime };
  }
  if (mime === "image/webp") {
    return { buffer: await sharp(buffer).rotate().webp().toBuffer(), mime };
  }
  return {
    buffer: await sharp(buffer).rotate().jpeg({ quality: 90 }).toBuffer(),
    mime: "image/jpeg",
  };
}

async function reencodeStoredImage(url: string, mime: string) {
  if (!IMAGE_TYPES.has(mime) || mime === "image/gif") return;
  const objectPath = storagePathFromPublicUrl(url);
  if (!objectPath?.startsWith("uploads/")) return;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not inspect uploaded image");
  }
  const original = Buffer.from(await response.arrayBuffer());
  const stripped = await stripImageMetadata(original, mime);
  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(objectPath, stripped.buffer, {
      contentType: stripped.mime,
      upsert: true,
    });
  if (uploadError) {
    throw new Error("Could not strip image metadata");
  }
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
  skipReencode?: boolean;
}) {
  if (!isAllowedCompletedMediaUrl(input.url, input.id)) {
    throw new Error("Invalid media URL");
  }

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
    if (asset.type === "image" && !input.skipReencode) {
      await reencodeStoredImage(asset.url, asset.mimeType);
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
  assertLocalDiskWritable();

  if (input.file.size > SERVERLESS_BODY_MAX) {
    throw new Error(
      "File too large for local upload path. Configure Supabase Storage or use a file under 4MB."
    );
  }

  const { id, filename } = buildObjectFilename(input.mime);
  await mkdir(uploadsRoot(), { recursive: true });
  const original = Buffer.from(await input.file.arrayBuffer());
  const stripped = await stripImageMetadata(original, input.mime);
  await writeFile(resolveLocalUploadPath(filename), stripped.buffer);

  return registerMediaAsset({
    id,
    name: path.basename(input.file.name || filename),
    url: `/uploads/${filename}`,
    type: input.kind,
    mimeType: stripped.mime,
    size: stripped.buffer.byteLength,
    folder: input.folder,
    skipReencode: true,
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
  const original = Buffer.from(await input.file.arrayBuffer());
  const stripped = await stripImageMetadata(original, input.mime);

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(objectPath, stripped.buffer, {
      contentType: stripped.mime,
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
    name: path.basename(input.file.name || filename),
    url: publicUrl,
    type: input.kind,
    mimeType: stripped.mime,
    size: stripped.buffer.byteLength,
    folder: input.folder,
    skipReencode: true,
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
      await unlink(resolveLocalUploadPath(path.basename(input.url)));
    } catch {
      // File may already be gone.
    }
  }

  return removed;
}
