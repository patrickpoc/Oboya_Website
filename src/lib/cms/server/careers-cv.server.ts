import "server-only";

import { randomUUID } from "node:crypto";
import { CV_MAX_BYTES, CV_MIME_TYPES, cvExtensionForMime, isValidCvObjectPath, validateCvFile } from "@/lib/cms/careers/validation";
import { CareersError, careersClient } from "@/lib/cms/server/careers-core.server";

export const CV_BUCKET = "careers-cv";
export const CV_DOWNLOAD_TTL_SECONDS = 60;

function storage() {
  const client = careersClient();
  // CV files need Supabase Storage; there is no local fallback.
  if (!client) throw new CareersError(503, "cv_storage_unavailable");
  return client.storage.from(CV_BUCKET);
}

/** Signed direct-to-storage upload URL for a new CV object bound to the application id. */
export async function createCvUploadUrl(input: { applicationId: string; mime: string; size: number }) {
  const check = validateCvFile(input.mime, input.size);
  if (!check.ok) throw new CareersError(400, check.errors[0]);
  const ext = cvExtensionForMime(input.mime)!;
  const path = `applications/${input.applicationId.toLowerCase()}/cv-${randomUUID()}.${ext}`;
  const { data, error } = await storage().createSignedUploadUrl(path);
  if (error || !data) throw new CareersError(503, "cv_storage_unavailable");
  return { path, signedUrl: data.signedUrl, token: data.token };
}

/** Confirms the uploaded object exists and re-checks its size/mime from storage metadata. */
export async function verifyCvObject(applicationId: string, path: string) {
  if (!isValidCvObjectPath(path, applicationId)) throw new CareersError(400, "invalidPath");
  const { data, error } = await storage().info(path);
  if (error || !data) throw new CareersError(404, "cv_not_uploaded");
  const size = Number(data.size ?? 0);
  const mime = String(data.contentType ?? "").toLowerCase();
  const check = validateCvFile(mime, size);
  if (!check.ok || size > CV_MAX_BYTES || !(CV_MIME_TYPES as readonly string[]).includes(mime)) {
    await removeCvObject(path);
    throw new CareersError(400, check.ok ? "invalidType" : check.errors[0]);
  }
  if (!(await hasExpectedSignature(path, mime))) {
    await removeCvObject(path);
    throw new CareersError(400, "invalidType");
  }
  return { size, mime };
}

const SIGNATURES: Record<string, number[]> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46, 0x2d],
  "application/msword": [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [0x50, 0x4b, 0x03, 0x04],
};

/** Compares the first bytes of the stored object with the claimed mime type. */
async function hasExpectedSignature(path: string, mime: string) {
  const expected = SIGNATURES[mime];
  if (!expected) return false;
  const { data, error } = await storage().download(path);
  if (error || !data) throw new CareersError(503, "cv_storage_unavailable");
  const head = new Uint8Array(await data.slice(0, expected.length).arrayBuffer());
  return expected.every((byte, i) => head[i] === byte);
}

export async function createCvDownloadUrl(path: string, filename?: string) {
  const { data, error } = await storage().createSignedUrl(path, CV_DOWNLOAD_TTL_SECONDS, {
    download: filename || true,
  });
  if (error || !data) throw new CareersError(404, "cv_not_found");
  return { url: data.signedUrl, expiresIn: CV_DOWNLOAD_TTL_SECONDS };
}

/** Removes one object. Best-effort by default (replace path); `strict` throws 503 on failure. */
export async function removeCvObject(path: string | null | undefined, strict = false) {
  if (!path || !isValidCvObjectPath(path)) return;
  try {
    const { error } = await storage().remove([path]);
    if (error) throw error;
  } catch {
    if (strict) throw new CareersError(503, "cv_storage_unavailable");
  }
}

/** Strict removal of every CV object of an application; throws 503 so the caller keeps the row. */
export async function removeAllCvObjects(applicationId: string) {
  if (!careersClient()) return;
  const folder = `applications/${applicationId.toLowerCase()}`;
  const bucket = storage();
  const { data, error } = await bucket.list(folder, { limit: 1000 });
  if (error) throw new CareersError(503, "cv_storage_unavailable");
  const paths = (data ?? []).filter((f) => f.name).map((f) => `${folder}/${f.name}`);
  if (!paths.length) return;
  const removed = await bucket.remove(paths);
  if (removed.error) throw new CareersError(503, "cv_storage_unavailable");
}
