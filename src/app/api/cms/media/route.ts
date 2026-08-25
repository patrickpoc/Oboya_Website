import { NextResponse } from "next/server";
import path from "node:path";
import { unauthorizedIfNeeded } from "@/lib/cms/server/cms-auth.server";
import {
  readMediaDurable,
  saveMediaDurable,
} from "@/lib/cms/server/content.server";
import { optimizeImageUpload } from "@/lib/cms/server/image-optimize.server";
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
    const base =
      sanitizeFilename(
        path.basename(file.name, path.extname(file.name))
      ) || "upload";
    const assetId = `media-${Date.now()}-${base}`.slice(0, 80);
    const now = new Date().toISOString();

    const optimized = await optimizeImageUpload({
      buffer: bytes,
      assetId,
      originalFilename: file.name,
      mimeType: file.type || "image/jpeg",
    });

    const asset: MediaAsset = {
      id: assetId,
      name: file.name,
      url: optimized.url,
      type: "image",
      mimeType: optimized.mimeType,
      size: optimized.size,
      width: optimized.width || undefined,
      height: optimized.height || undefined,
      folder: folderId,
      tags: ["upload", "optimized"].filter(Boolean),
      createdAt: now,
      updatedAt: now,
      optimizationStatus: optimized.status,
      originalUrl: optimized.originalUrl,
      originalSize: optimized.originalSize,
      originalMimeType: optimized.originalMimeType,
      format: optimized.format,
      variants: optimized.variants,
    };

    if (optimized.status === "failed") {
      asset.tags = ["upload", "optimization-failed"];
    } else if (optimized.status === "skipped") {
      asset.tags = ["upload", "passthrough"];
    }

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
