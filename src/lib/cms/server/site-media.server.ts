import "server-only";

import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { MediaAsset, MediaFolder } from "@/lib/cms/types";

const MEDIA_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".mp4",
  ".webm",
]);

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function slugId(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function folderIdForPublicPath(publicPath: string): string {
  // publicPath like /assets/homepage/foo.jpg
  const parts = publicPath.split("/").filter(Boolean);
  if (parts[0] === "uploads") return "folder-uploads";
  if (parts[0] !== "assets") return "folder-site";

  const fileName = parts[parts.length - 1] || "";
  if (fileName.startsWith("cert-")) return "folder-certs";

  const section = parts[1];
  if (!section || section.includes(".")) return "folder-brand";

  if (section === "homepage") return "folder-homepage";
  if (section === "about") return "folder-about";
  if (section === "solutions") return "folder-solutions";
  if (section === "pdf-pages") return "folder-pdf-pages";
  return `folder-${slugId(section)}`;
}

function tagsForPublicPath(publicPath: string): string[] {
  const tags = ["site"];
  const parts = publicPath.split("/").filter(Boolean);
  if (parts[0] === "uploads") tags.push("upload");
  if (parts[1]) tags.push(parts[1]);
  return tags;
}

async function walkFiles(absDir: string, relFromPublic: string): Promise<string[]> {
  const entries = await readdir(absDir, { withFileTypes: true });
  const out: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const abs = path.join(absDir, entry.name);
    const rel = path.posix.join(relFromPublic, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkFiles(abs, rel)));
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!MEDIA_EXT.has(ext)) continue;
    out.push(rel);
  }

  return out;
}

export const SITE_MEDIA_FOLDERS: MediaFolder[] = [
  {
    id: "folder-about",
    name: "About",
    parentId: "folder-root",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "folder-solutions",
    name: "Solutions",
    parentId: "folder-root",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "folder-brand",
    name: "Brand",
    parentId: "folder-root",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "folder-pdf-pages",
    name: "PDF Pages",
    parentId: "folder-root",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "folder-uploads",
    name: "Uploads",
    parentId: "folder-root",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

/**
 * Scan bundled site media under public/assets (+ local public/uploads)
 * so the Media Library always lists every image/video shipped with the site.
 */
export async function scanSiteMediaAssets(): Promise<MediaAsset[]> {
  const publicRoot = path.join(process.cwd(), "public");
  const roots = ["assets", "uploads"] as const;
  const found: string[] = [];

  for (const root of roots) {
    const abs = path.join(publicRoot, root);
    try {
      const info = await stat(abs);
      if (!info.isDirectory()) continue;
      found.push(...(await walkFiles(abs, root)));
    } catch {
      // Directory may not exist in some environments.
    }
  }

  const assets: MediaAsset[] = [];

  for (const rel of found.sort()) {
    const ext = path.extname(rel).toLowerCase();
    const mime = MIME_BY_EXT[ext] ?? "application/octet-stream";
    const isVideo = mime.startsWith("video/");
    const publicPath = `/${rel.split(path.sep).join("/")}`;
    const name = path.basename(rel);
    let size = 0;
    try {
      size = (await stat(path.join(publicRoot, rel))).size;
    } catch {
      size = 0;
    }

    assets.push({
      id: `site-${slugId(publicPath)}`,
      name,
      url: publicPath,
      type: isVideo ? "video" : "image",
      mimeType: mime,
      size,
      folder: folderIdForPublicPath(publicPath),
      tags: tagsForPublicPath(publicPath),
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
  }

  return assets;
}
