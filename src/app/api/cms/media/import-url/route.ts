import { NextResponse } from "next/server";
import { cmsGuardAny } from "@/lib/cms/server/require-cms-auth";
import { ImportBrakeError, importRemoteImageToLibrary } from "@/lib/cms/server/media-import-url.server";
import { MediaImageError } from "@/lib/cms/server/media-upload.server";
import { RemoteImageError } from "@/lib/security/safe-remote-image";

export const dynamic = "force-dynamic";
// DNS, up to 3 redirects and the download share a 15 s budget; leave room for sharp and upload.
export const maxDuration = 60;

const MAX_URL_LENGTH = 2048;

/** Copies one external https image into the media library (used by bulk import). */
export async function POST(request: Request) {
  const auth = await cmsGuardAny([
    { module: "media", action: "create" },
    { module: "marketplace", action: "create" },
  ]);
  if ("response" in auth) return auth.response;

  let url = "";
  try {
    const body = (await request.json()) as { url?: unknown };
    url = typeof body.url === "string" ? body.url.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!url || url.length > MAX_URL_LENGTH) {
    return NextResponse.json({ error: "A valid image URL is required." }, { status: 400 });
  }

  try {
    const asset = await importRemoteImageToLibrary(url);
    return NextResponse.json({ ok: true, asset });
  } catch (error) {
    if (error instanceof ImportBrakeError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    if (error instanceof RemoteImageError || error instanceof MediaImageError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("Image import failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not store the image." }, { status: 500 });
  }
}
