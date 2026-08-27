import type { MediaAsset } from "@/lib/cms/types";

const IMAGE_MAX = 8 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;
const SERVERLESS_BODY_MAX = 3.5 * 1024 * 1024;

export type UploadMediaOptions = {
  folder?: string;
};

/**
 * Upload an image/video for CMS use.
 * Uses signed direct-to-Supabase when configured (required on Vercel);
 * falls back to multipart API for small local-dev uploads.
 */
export async function uploadMediaFile(
  file: File,
  options: UploadMediaOptions = {}
): Promise<MediaAsset> {
  const mime = (file.type || "").toLowerCase();
  const isVideo = mime.startsWith("video/");
  const max = isVideo ? VIDEO_MAX : IMAGE_MAX;

  if (!mime || (!mime.startsWith("image/") && !mime.startsWith("video/"))) {
    throw new Error("Unsupported file type. Use JPEG/PNG/WebP/GIF or MP4/WebM.");
  }

  if (file.size > max) {
    throw new Error(`File too large. Max ${isVideo ? "50MB" : "8MB"}.`);
  }

  const useDirect =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    (isVideo || file.size > SERVERLESS_BODY_MAX);

  if (useDirect) {
    const signRes = await fetch("/api/cms/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sign",
        mimeType: mime,
        size: file.size,
        name: file.name,
        folder: options.folder,
      }),
    });
    const signed = (await signRes.json()) as {
      error?: string;
      id?: string;
      publicUrl?: string;
      signedUrl?: string;
      kind?: MediaAsset["type"];
      mimeType?: string;
      originalName?: string;
    };
    if (!signRes.ok || !signed.signedUrl || !signed.id || !signed.publicUrl) {
      throw new Error(signed.error ?? "Could not start upload");
    }

    const putRes = await fetch(signed.signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mime || "application/octet-stream",
      },
      body: file,
    });
    if (!putRes.ok) {
      const detail = await putRes.text().catch(() => "");
      throw new Error(
        detail ||
          "Storage upload failed. Confirm the cms-media bucket exists in Supabase."
      );
    }

    const completeRes = await fetch("/api/cms/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "complete",
        id: signed.id,
        url: signed.publicUrl,
        type: signed.kind ?? (isVideo ? "video" : "image"),
        mimeType: signed.mimeType ?? mime,
        size: file.size,
        name: signed.originalName ?? file.name,
        folder: options.folder,
      }),
    });
    const completed = (await completeRes.json()) as {
      error?: string;
      asset?: MediaAsset;
    };
    if (!completeRes.ok || !completed.asset) {
      throw new Error(completed.error ?? "Upload finalize failed");
    }
    return completed.asset;
  }

  const body = new FormData();
  body.append("file", file);
  if (options.folder) body.append("folder", options.folder);

  const res = await fetch("/api/cms/media", { method: "POST", body });
  const data = (await res.json()) as {
    error?: string;
    asset?: MediaAsset;
  };
  if (!res.ok || !data.asset) {
    throw new Error(data.error ?? "Upload failed");
  }
  return data.asset;
}
