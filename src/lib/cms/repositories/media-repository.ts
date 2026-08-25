import type { MediaAsset, MediaFolder } from "@/lib/cms/types";

/* ── Folders ─────────────────────────────────────────────── */

const MOCK_FOLDERS: MediaFolder[] = [
  { id: "folder-root", name: "Root", parentId: null, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "folder-homepage", name: "Homepage", parentId: "folder-root", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "folder-stock", name: "Stock Photos", parentId: "folder-root", createdAt: "2026-02-01T00:00:00.000Z" },
  { id: "folder-certs", name: "Certifications", parentId: "folder-homepage", createdAt: "2026-01-15T00:00:00.000Z" },
];

let folders = [...MOCK_FOLDERS];

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

const MOCK_MEDIA: MediaAsset[] = [
  {
    id: "media-1", name: "company-overview.webp",
    url: "/assets/homepage/company-overview.webp",
    type: "image", mimeType: "image/webp", size: 245000, width: 1920, height: 1080,
    folder: "folder-homepage", tags: ["hero", "company"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-hero-pill-1", name: "hero-pill-logistics.png",
    url: "/assets/homepage/hero-pill-logistics.png",
    type: "image", mimeType: "image/png", size: 42000, width: 400, height: 400,
    folder: "folder-homepage", tags: ["hero", "logistics"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-hero-pill-2", name: "hero-pill-rd.png",
    url: "/assets/homepage/hero-pill-rd.png",
    type: "image", mimeType: "image/png", size: 40000, width: 400, height: 400,
    folder: "folder-homepage", tags: ["hero", "r&d"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-hero-pill-3", name: "hero-pill-plants.png",
    url: "/assets/homepage/hero-pill-plants.png",
    type: "image", mimeType: "image/png", size: 41000, width: 400, height: 400,
    folder: "folder-homepage", tags: ["hero", "plants"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-solutions-1", name: "solutions-integrated.jpg",
    url: "/assets/homepage/solutions-integrated.jpg",
    type: "image", mimeType: "image/jpeg", size: 120000, width: 1200, height: 800,
    folder: "folder-homepage", tags: ["solutions"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-solutions-2", name: "solutions-global.jpg",
    url: "/assets/homepage/solutions-global.jpg",
    type: "image", mimeType: "image/jpeg", size: 118000, width: 1200, height: 800,
    folder: "folder-homepage", tags: ["solutions", "global"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-solutions-3", name: "solutions-logistics.jpg",
    url: "/assets/homepage/solutions-logistics.jpg",
    type: "image", mimeType: "image/jpeg", size: 115000, width: 1200, height: 800,
    folder: "folder-homepage", tags: ["solutions", "logistics"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-cert-brcgs", name: "cert-brcgs.png",
    url: "/assets/homepage/cert-brcgs.png",
    type: "image", mimeType: "image/png", size: 28000, width: 200, height: 200,
    folder: "folder-certs", tags: ["certification", "brcgs"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-cert-sedex", name: "cert-sedex-smeta.png",
    url: "/assets/homepage/cert-sedex-smeta.png",
    type: "image", mimeType: "image/png", size: 32000, width: 200, height: 200,
    folder: "folder-certs", tags: ["certification", "sedex"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-cert-grs", name: "cert-grs.png",
    url: "/assets/homepage/cert-grs.png",
    type: "image", mimeType: "image/png", size: 30000, width: 200, height: 200,
    folder: "folder-certs", tags: ["certification", "grs"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-cert-iso", name: "cert-iso-9001.png",
    url: "/assets/homepage/cert-iso-9001.png",
    type: "image", mimeType: "image/png", size: 26000, width: 200, height: 200,
    folder: "folder-certs", tags: ["certification", "iso"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-3", name: "greenhouse-hero.jpg",
    url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800",
    type: "image", mimeType: "image/jpeg", size: 180000, width: 800, height: 534,
    folder: "folder-stock", tags: ["greenhouse", "hero"],
    createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z",
  },
  {
    id: "media-4", name: "berries-packaging.jpg",
    url: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=800",
    type: "image", mimeType: "image/jpeg", size: 160000, width: 800, height: 534,
    folder: "folder-stock", tags: ["berries", "packaging"],
    createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z",
  },
  {
    id: "media-5", name: "flowers-field.jpg",
    url: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=800",
    type: "image", mimeType: "image/jpeg", size: 170000, width: 800, height: 534,
    folder: "folder-stock", tags: ["flowers", "nature"],
    createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z",
  },
];

let cache = [...MOCK_MEDIA];

export function getMediaAssets(folderId?: string): MediaAsset[] {
  if (!folderId) return cache;
  return cache.filter((m) => m.folder === folderId);
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

export function replaceMediaAssetsCache(assets: MediaAsset[]) {
  cache = [...assets];
}

export function deleteMediaAsset(id: string): boolean {
  const idx = cache.findIndex((m) => m.id === id);
  if (idx < 0) return false;
  cache.splice(idx, 1);
  return true;
}
