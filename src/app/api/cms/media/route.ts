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
import { syncMediaLibraryFromSupabase, persistMediaAssetRow } from "@/lib/cms/server/media-library.server";
import {
  readMediaFoldersDurable,
  saveMediaFoldersDurable,
} from "@/lib/cms/server/media-folders.server";
import {
  createMediaFolder,
  getMediaAssets,
  getMediaFolders,
  moveMediaFolder,
  renameMediaFolder,
} from "@/lib/cms/repositories/media-repository";
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
    const [assets, folders] = await Promise.all([
      syncMediaLibraryFromSupabase(),
      readMediaFoldersDurable(),
    ]);
    return NextResponse.json({
      ok: true,
      ready: true,
      assets,
      folders,
      count: assets.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load media library";
    console.error("Media library load failed:", message);
    return NextResponse.json({ error: message, ready: false }, { status: 500 });
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
        parentId?: string | null;
        targetParentId?: string;
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

      if (body.action === "folder-create") {
        if (!body.name?.trim()) {
          return NextResponse.json(
            { error: "Folder name is required" },
            { status: 400 }
          );
        }
        await readMediaFoldersDurable();
        const folder = createMediaFolder(
          body.name.trim(),
          body.parentId ?? "folder-root"
        );
        const folders = await saveMediaFoldersDurable(getMediaFolders());
        return NextResponse.json({ ok: true, folder, folders });
      }

      if (body.action === "folder-rename") {
        if (!body.id || !body.name?.trim()) {
          return NextResponse.json(
            { error: "Folder id and name are required" },
            { status: 400 }
          );
        }
        await readMediaFoldersDurable();
        const folder = renameMediaFolder(body.id, body.name.trim());
        if (!folder) {
          return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }
        const folders = await saveMediaFoldersDurable(getMediaFolders());
        return NextResponse.json({ ok: true, folder, folders });
      }

      if (body.action === "folder-move") {
        if (!body.id || !body.targetParentId) {
          return NextResponse.json(
            { error: "Folder id and targetParentId are required" },
            { status: 400 }
          );
        }
        await readMediaFoldersDurable();
        const folder = moveMediaFolder(body.id, body.targetParentId);
        if (!folder) {
          return NextResponse.json(
            { error: "Invalid folder move" },
            { status: 400 }
          );
        }
        const folders = await saveMediaFoldersDurable(getMediaFolders());
        return NextResponse.json({ ok: true, folder, folders });
      }

      if (body.action === "update-tags") {
        if (!body.id || !Array.isArray((body as { tags?: unknown }).tags)) {
          return NextResponse.json(
            { error: "Asset id and tags are required" },
            { status: 400 }
          );
        }
        await syncMediaLibraryFromSupabase();
        const tags = (body as { tags: string[] }).tags
          .map((t) => String(t).trim())
          .filter(Boolean);
        const current = getMediaAssets().find((a) => a.id === body.id);
        if (!current) {
          return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }
        if (
          current.id.startsWith("site-") ||
          current.id.startsWith("used-") ||
          current.url.startsWith("/assets/")
        ) {
          return NextResponse.json(
            { error: "Site reference tags can’t be edited" },
            { status: 400 }
          );
        }
        const asset = {
          ...current,
          tags,
          updatedAt: new Date().toISOString(),
        };
        await persistMediaAssetRow(asset);
        return NextResponse.json({ ok: true, asset });
      }

      if (body.action === "move-asset") {
        if (!body.id || !body.folder) {
          return NextResponse.json(
            { error: "Asset id and folder are required" },
            { status: 400 }
          );
        }
        await syncMediaLibraryFromSupabase();
        const current = getMediaAssets().find((a) => a.id === body.id);
        if (!current) {
          return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }
        if (
          current.id.startsWith("site-") ||
          current.id.startsWith("used-") ||
          current.url.startsWith("/assets/")
        ) {
          return NextResponse.json(
            { error: "Site references can’t be moved" },
            { status: 400 }
          );
        }
        const asset = {
          ...current,
          folder: body.folder,
          updatedAt: new Date().toISOString(),
        };
        await persistMediaAssetRow(asset);
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
