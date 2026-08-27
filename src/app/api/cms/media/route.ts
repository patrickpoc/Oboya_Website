import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { unauthorizedIfNeeded } from "@/lib/cms/server/cms-auth.server";
import {
  readMediaDurable,
  saveMediaDurable,
} from "@/lib/cms/server/content.server";
import type { MediaAsset } from "@/lib/cms/types";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const MAX_BYTES = 8 * 1024 * 1024;

function sanitizeFilename(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 120);
}

export async function GET() {
  const assets = await readMediaDurable();
  return NextResponse.json(assets);
}

export async function POST(request: Request) {
  const denied = await unauthorizedIfNeeded();
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported image type" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large (max 8MB)" },
        { status: 400 }
      );
    }

    const folderRaw = form.get("folderId");
    const folderId =
      typeof folderRaw === "string" && folderRaw.trim()
        ? folderRaw.trim()
        : "folder-root";

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext =
      path.extname(file.name).toLowerCase() ||
      (file.type === "image/png"
        ? ".png"
        : file.type === "image/webp"
          ? ".webp"
          : file.type === "image/gif"
            ? ".gif"
            : file.type === "image/svg+xml"
              ? ".svg"
              : ".jpg");
    const base = sanitizeFilename(path.basename(file.name, path.extname(file.name))) ||
      "upload";
    const filename = `${Date.now()}-${base}${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), bytes);

    const publicUrl = `/uploads/${filename}`;
    const now = new Date().toISOString();
    const asset: MediaAsset = {
      id: `media-upload-${Date.now()}`,
      name: file.name,
      url: publicUrl,
      type: "image",
      mimeType: file.type || "image/jpeg",
      size: file.size,
      folder: folderId,
      tags: ["upload"],
      createdAt: now,
      updatedAt: now,
    };

    const saved = await saveMediaDurable(asset);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Media upload failed:", error);
    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 }
    );
  }
}
