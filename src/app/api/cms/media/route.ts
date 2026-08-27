import { NextResponse } from "next/server";
import {
  createSignedMediaUpload,
  mediaKind,
  maxBytesForKind,
  registerMediaAsset,
  storeMediaLocally,
  storeMediaViaSupabaseServer,
} from "@/lib/cms/server/media-upload.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";

async function assertAdmin() {
  if (!isSupabaseConfigured()) return true;
  const user = await requireAdminUser();
  return Boolean(user);
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
        return NextResponse.json({ ok: true, ...signed });
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
        });
        return NextResponse.json({ ok: true, asset });
      }

      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

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

    if (file.size > maxBytesForKind(kind)) {
      return NextResponse.json(
        {
          error: `File too large. Max ${kind === "video" ? "50MB" : "8MB"}.`,
        },
        { status: 400 }
      );
    }

    const asset = isSupabaseConfigured()
      ? await storeMediaViaSupabaseServer({ file, mime, kind })
      : await storeMediaLocally({ file, mime, kind });

    return NextResponse.json({ ok: true, asset });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload media";
    console.error("Media upload failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
