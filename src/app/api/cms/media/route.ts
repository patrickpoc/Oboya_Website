import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { saveMediaAsset } from "@/lib/cms/repositories/media-repository";
import type { MediaAsset } from "@/lib/cms/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

const IMAGE_MAX = 8 * 1024 * 1024;
const VIDEO_MAX = 15 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

function mediaKind(mime: string): MediaAsset["type"] | null {
  if (IMAGE_TYPES.has(mime)) return "image";
  if (VIDEO_TYPES.has(mime)) return "video";
  return null;
}

export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const mime = (file.type || "").toLowerCase();
    const kind = mediaKind(mime);
    if (!kind) {
      return NextResponse.json(
        { error: "Unsupported file type. Use JPEG/PNG/WebP/GIF or MP4/WebM." },
        { status: 400 }
      );
    }

    const max = kind === "video" ? VIDEO_MAX : IMAGE_MAX;
    if (file.size > max) {
      return NextResponse.json(
        {
          error: `File too large. Max ${kind === "video" ? "15MB" : "8MB"}.`,
        },
        { status: 400 }
      );
    }

    const ext = EXT_BY_MIME[mime] ?? "bin";
    const id = `media-${randomUUID()}`;
    const filename = `${id}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadsDir, filename), buffer);

    const url = `/uploads/${filename}`;
    const asset = saveMediaAsset({
      id,
      name: file.name || filename,
      url,
      type: kind,
      mimeType: mime,
      size: file.size,
      folder: "uploads",
      tags: kind === "video" ? ["video", "upload"] : ["upload"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, asset });
  } catch {
    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 }
    );
  }
}
