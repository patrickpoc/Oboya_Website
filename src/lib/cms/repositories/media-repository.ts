import type { MediaAsset } from "@/lib/cms/types";

const MOCK_MEDIA: MediaAsset[] = [
  {
    id: "media-1",
    name: "company-overview.webp",
    url: "/assets/homepage/company-overview.webp",
    type: "image",
    mimeType: "image/webp",
    size: 245000,
    folder: "homepage",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-2",
    name: "oboya-horticulture-catalogue-2024.pdf",
    url: "/assets/catalogue/oboya-horticulture-catalogue-2024.pdf",
    type: "document",
    mimeType: "application/pdf",
    size: 5200000,
    folder: "catalogue",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-3",
    name: "greenhouse-hero.jpg",
    url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800",
    type: "image",
    mimeType: "image/jpeg",
    size: 180000,
    folder: "stock",
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
  },
];

let cache = [...MOCK_MEDIA];

export function getMediaAssets(folder?: string): MediaAsset[] {
  if (!folder) return cache;
  return cache.filter((m) => m.folder === folder);
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
