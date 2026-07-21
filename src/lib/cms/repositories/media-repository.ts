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
    id: "media-hero-pill-1",
    name: "hero-pill-logistics.png",
    url: "/assets/homepage/hero-pill-logistics.png",
    type: "image",
    mimeType: "image/png",
    size: 42000,
    folder: "homepage",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-hero-pill-2",
    name: "hero-pill-rd.png",
    url: "/assets/homepage/hero-pill-rd.png",
    type: "image",
    mimeType: "image/png",
    size: 40000,
    folder: "homepage",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-hero-pill-3",
    name: "hero-pill-plants.png",
    url: "/assets/homepage/hero-pill-plants.png",
    type: "image",
    mimeType: "image/png",
    size: 41000,
    folder: "homepage",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-solutions-1",
    name: "solutions-integrated.jpg",
    url: "/assets/homepage/solutions-integrated.jpg",
    type: "image",
    mimeType: "image/jpeg",
    size: 120000,
    folder: "homepage",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-solutions-2",
    name: "solutions-global.jpg",
    url: "/assets/homepage/solutions-global.jpg",
    type: "image",
    mimeType: "image/jpeg",
    size: 118000,
    folder: "homepage",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-solutions-3",
    name: "solutions-logistics.jpg",
    url: "/assets/homepage/solutions-logistics.jpg",
    type: "image",
    mimeType: "image/jpeg",
    size: 115000,
    folder: "homepage",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-cert-brcgs",
    name: "cert-brcgs.png",
    url: "/assets/homepage/cert-brcgs.png",
    type: "image",
    mimeType: "image/png",
    size: 28000,
    folder: "homepage",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-cert-sedex",
    name: "cert-sedex-smeta.png",
    url: "/assets/homepage/cert-sedex-smeta.png",
    type: "image",
    mimeType: "image/png",
    size: 32000,
    folder: "homepage",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-cert-grs",
    name: "cert-grs.png",
    url: "/assets/homepage/cert-grs.png",
    type: "image",
    mimeType: "image/png",
    size: 30000,
    folder: "homepage",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "media-cert-iso",
    name: "cert-iso-9001.png",
    url: "/assets/homepage/cert-iso-9001.png",
    type: "image",
    mimeType: "image/png",
    size: 26000,
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
  {
    id: "media-4",
    name: "berries-packaging.jpg",
    url: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=800",
    type: "image",
    mimeType: "image/jpeg",
    size: 160000,
    folder: "stock",
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
  },
  {
    id: "media-5",
    name: "flowers-field.jpg",
    url: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=800",
    type: "image",
    mimeType: "image/jpeg",
    size: 170000,
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
