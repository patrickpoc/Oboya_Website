import { NextResponse } from "next/server";
import {
  createSignedMediaUpload,
  mediaKind,
  maxBytesForKind,
  registerMediaAsset,
  removeMediaAsset,
  storeMediaLocally,
  storeMediaViaSupabaseServer,
} from "@/lib/cms/server/media-upload.server";
import { syncMediaLibraryFromSupabase } from "@/lib/cms/server/media-library.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";

async function assertAdmin() {
  if (!isSupabaseConfigured()) return true;
  const user = await requireAdminUser();
  return Boolean(user);
}

export async function GET() {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Always include scanned site assets, even without Supabase.
    const assets = await syncMediaLibraryFromSupabase();
    return NextResponse.json({ ok: true, assets });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load media library";
    console.error("Media library load failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const url = searchParams.get("url") ?? undefined;

    if (!id) {
      return NextResponse.json({ error: "Asset id is required" }, { status: 400 });
    }

    const removed = await removeMediaAsset({ id, url });
    return NextResponse.json({ ok: true, removed });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete media";
    console.error("Media delete failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        action?: string;
        mimeType?: string;
        size?: number;
        name?: string;
        id?: string;
        url?: string;
        type?: "image" | "video";
        folder?: string;
      };

      if (body.action === "sign") {
        if (!isSupabaseConfigured()) {
          return NextResponse.json(
            { error: "Direct uploads require Supabase Storage." },
            { status: 400 }
          );
        }
        const signed = await createSignedMediaUpload({
          mime: body.mimeType || "",
          size: Number(body.size) || 0,
          originalName: body.name,
        });
        return NextResponse.json({
          ok: true,
          ...signed,
          folder: body.folder,
        });
      }

      if (body.action === "complete") {
        if (!body.id || !body.url || !body.type || !body.mimeType) {
          return NextResponse.json(
            { error: "Missing upload metadata." },
            { status: 400 }
          );
        }
        const asset = await registerMediaAsset({
          id: body.id,
          name: body.name || body.id,
          url: body.url,
          type: body.type,
          mimeType: body.mimeType,
          size: Number(body.size) || 0,
          folder: body.folder,
        });
        return NextResponse.json({ ok: true, asset });
      }

      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const folderField = form.get("folder");
    const folder =
      typeof folderField === "string" && folderField ? folderField : undefined;

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

    if (file.size > maxBytesForKind(kind)) {
      return NextResponse.json(
        {
          error: `File too large. Max ${kind === "video" ? "50MB" : "8MB"}.`,
        },
        { status: 400 }
      );
    }

    const asset = isSupabaseConfigured()
      ? await storeMediaViaSupabaseServer({ file, mime, kind, folder })
      : await storeMediaLocally({ file, mime, kind, folder });

    return NextResponse.json({ ok: true, asset });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload media";
    console.error("Media upload failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
