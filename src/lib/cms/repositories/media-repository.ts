import type { MediaAsset, MediaFolder } from "@/lib/cms/types";

/* ── Folders ─────────────────────────────────────────────── */

const MOCK_FOLDERS: MediaFolder[] = [
  { id: "folder-root", name: "Root", parentId: null, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "folder-homepage", name: "Homepage", parentId: "folder-root", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "folder-about", name: "About", parentId: "folder-root", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "folder-solutions", name: "Solutions", parentId: "folder-root", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "folder-brand", name: "Brand", parentId: "folder-root", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "folder-pdf-pages", name: "PDF Pages", parentId: "folder-root", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "folder-uploads", name: "Uploads", parentId: "folder-root", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "folder-stock", name: "Stock Photos", parentId: "folder-root", createdAt: "2026-02-01T00:00:00.000Z" },
  { id: "folder-certs", name: "Certifications", parentId: "folder-homepage", createdAt: "2026-01-15T00:00:00.000Z" },
];

let folders = [...MOCK_FOLDERS];

export function ensureMediaFolders(extra: MediaFolder[]) {
  const byId = new Map(folders.map((f) => [f.id, f]));
  for (const folder of extra) {
    if (!byId.has(folder.id)) {
      byId.set(folder.id, folder);
    }
  }
  folders = Array.from(byId.values());
}

export function getMediaFolders(): MediaFolder[] {
  return folders;
}

export function getChildFolders(parentId: string | null): MediaFolder[] {
  return folders.filter((f) => f.parentId === parentId);
}

export function createMediaFolder(name: string, parentId: string | null): MediaFolder {
  const folder: MediaFolder = {
    id: `folder-${Date.now()}`,
    name,
    parentId,
    createdAt: new Date().toISOString(),
  };
  folders.push(folder);
  return folder;
}

export function renameMediaFolder(id: string, name: string): MediaFolder | null {
  const folder = folders.find((f) => f.id === id);
  if (!folder) return null;
  folder.name = name;
  return folder;
}

export function moveMediaFolder(id: string, newParentId: string): MediaFolder | null {
  if (id === newParentId) return null;
  const folder = folders.find((f) => f.id === id);
  if (!folder) return null;
  const isDescendant = (parentId: string, targetId: string): boolean => {
    for (const f of folders) {
      if (f.parentId === parentId) {
        if (f.id === targetId) return true;
        if (isDescendant(f.id, targetId)) return true;
      }
    }
    return false;
  };
  if (isDescendant(id, newParentId)) return null;
  folder.parentId = newParentId;
  return folder;
}

export function deleteMediaFolder(id: string): boolean {
  const descendants = new Set<string>();
  const collect = (pid: string) => {
    for (const f of folders) {
      if (f.parentId === pid) {
        descendants.add(f.id);
        collect(f.id);
      }
    }
  };
  descendants.add(id);
  collect(id);
  cache = cache.filter((a) => !descendants.has(a.folder));
  folders = folders.filter((f) => !descendants.has(f.id));
  return true;
}

export function getFolderBreadcrumb(folderId: string): MediaFolder[] {
  const crumbs: MediaFolder[] = [];
  let current = folders.find((f) => f.id === folderId);
  while (current) {
    crumbs.unshift(current);
    current = current.parentId ? folders.find((f) => f.id === current!.parentId) : undefined;
  }
  return crumbs;
}

/* ── Assets ──────────────────────────────────────────────── */

let cache: MediaAsset[] = [];

export function getMediaAssets(folderId?: string): MediaAsset[] {
  // Root shows the full library; nested folders filter by exact folder id.
  if (!folderId || folderId === "folder-root") return cache;
  return cache.filter((m) => m.folder === folderId);
}

/**
 * Rebuild library cache from in-use site files + remote uploads.
 * Dedupes by URL.
 *
 * Single-arg form: treat the array as the full library from the API.
 */
export function replaceMediaAssetsCache(remote: MediaAsset[], site: MediaAsset[] = []) {
  const byUrl = new Map<string, MediaAsset>();
  const source =
    site.length === 0 && remote.length > 0 ? remote : [...site, ...remote];

  for (const asset of source) {
    byUrl.set(asset.url, asset);
  }

  cache = Array.from(byUrl.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getAllTags(): string[] {
  const set = new Set<string>();
  for (const a of cache) for (const t of a.tags) set.add(t);
  return Array.from(set).sort();
}

export function searchMediaAssets(query: string, tags?: string[], folderId?: string): MediaAsset[] {
  const q = query.toLowerCase().trim();
  return cache.filter((asset) => {
    if (folderId && asset.folder !== folderId) return false;
    if (tags && tags.length > 0 && !tags.some((t) => asset.tags.includes(t))) return false;
    if (!q) return true;
    return (
      asset.name.toLowerCase().includes(q) ||
      asset.tags.some((t) => t.toLowerCase().includes(q)) ||
      asset.mimeType.toLowerCase().includes(q) ||
      asset.type.toLowerCase().includes(q)
    );
  });
}

export function updateAssetTags(id: string, tags: string[]): MediaAsset | null {
  const asset = cache.find((a) => a.id === id);
  if (!asset) return null;
  asset.tags = tags;
  asset.updatedAt = new Date().toISOString();
  return asset;
}

export function moveAssetToFolder(id: string, folderId: string): MediaAsset | null {
  const asset = cache.find((a) => a.id === id);
  if (!asset) return null;
  asset.folder = folderId;
  asset.updatedAt = new Date().toISOString();
  return asset;
}

export function saveMediaAsset(asset: MediaAsset): MediaAsset {
  const idx = cache.findIndex((m) => m.id === asset.id);
  if (idx >= 0) cache[idx] = asset;
  else cache.push(asset);
  return asset;
}

export function deleteMediaAsset(id: string): boolean {
  const idx = cache.findIndex((m) => m.id === id);
  if (idx < 0) return false;
  cache.splice(idx, 1);
  return true;
}
