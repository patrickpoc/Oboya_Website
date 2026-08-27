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

/** Remote stock references still useful in the picker (not local files). */
const STOCK_MEDIA: MediaAsset[] = [
  {
    id: "media-3", name: "greenhouse-hero.jpg",
    url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800",
    type: "image", mimeType: "image/jpeg", size: 180000, width: 800, height: 534,
    folder: "folder-stock", tags: ["greenhouse", "hero", "stock"],
    createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z",
  },
  {
    id: "media-4", name: "berries-packaging.jpg",
    url: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=800",
    type: "image", mimeType: "image/jpeg", size: 160000, width: 800, height: 534,
    folder: "folder-stock", tags: ["berries", "packaging", "stock"],
    createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z",
  },
  {
    id: "media-5", name: "flowers-field.jpg",
    url: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=800",
    type: "image", mimeType: "image/jpeg", size: 170000, width: 800, height: 534,
    folder: "folder-stock", tags: ["flowers", "nature", "stock"],
    createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z",
  },
];

let cache = [...STOCK_MEDIA];

export function getMediaAssets(folderId?: string): MediaAsset[] {
  if (!folderId) return cache;
  return cache.filter((m) => m.folder === folderId);
}

/**
 * Rebuild library cache from site files + remote uploads + stock references.
 * Dedupes by URL (remote/site win over older entries with the same path).
 */
export function replaceMediaAssetsCache(remote: MediaAsset[], site: MediaAsset[] = []) {
  const byUrl = new Map<string, MediaAsset>();
  const byId = new Map<string, MediaAsset>();

  for (const asset of [...STOCK_MEDIA, ...site, ...remote]) {
    byUrl.set(asset.url, asset);
    byId.set(asset.id, asset);
  }

  // Prefer URL uniqueness so site path and DB row for the same file collapse.
  const unique = new Map<string, MediaAsset>();
  for (const asset of byUrl.values()) {
    unique.set(asset.id, asset);
  }
  // Keep any id-only leftovers (should be none after URL pass).
  for (const asset of byId.values()) {
    if (![...unique.values()].some((a) => a.url === asset.url)) {
      unique.set(asset.id, asset);
    }
  }

  cache = Array.from(unique.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
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
