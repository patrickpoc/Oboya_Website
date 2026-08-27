import { homepageImages } from "@/constants/homepage-images";
import type { MediaAsset } from "@/lib/cms/types";

/** Paths used by live site elements (shared client/server). */
export const SITE_IN_USE_MEDIA_URLS = [
  "/assets/logo.svg",
  "/assets/world-map.svg",
  homepageImages.companyOverview,
  homepageImages.greenhouseTechnology,
  homepageImages.asiaPacificExpansion,
  homepageImages.heroVineyard,
  homepageImages.heroHandsHerbs,
  "/assets/homepage/capabilities-value-chain.jpg",
  "/assets/homepage/capabilities-global-local.jpg",
  "/assets/homepage/capabilities-partnerships.jpg",
  "/assets/homepage/solutions-logistics.jpg",
  "/assets/homepage/solutions-integrated.jpg",
  "/assets/homepage/solutions-global.jpg",
  "/assets/homepage/company-overview.webp",
  "/assets/about/institutional.png",
  "/assets/homepage/cert-brcgs.png",
  "/assets/homepage/cert-sedex-smeta.png",
  "/assets/homepage/cert-grs.png",
  "/assets/homepage/cert-iso-9001.png",
] as const;

function slugId(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function folderForUrl(url: string): string {
  if (url.includes("/about/")) return "folder-about";
  if (url.includes("/solutions/")) return "folder-solutions";
  if (url.includes("cert-")) return "folder-certs";
  if (url.includes("/homepage/")) return "folder-homepage";
  if (url.startsWith("/uploads/")) return "folder-uploads";
  if (url.startsWith("http")) return "folder-site";
  return "folder-brand";
}

function mimeFromUrl(url: string): string {
  const pathOnly = url.split("?")[0] || url;
  const ext = pathOnly.slice(pathOnly.lastIndexOf(".")).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    default:
      return url.startsWith("http") ? "image/jpeg" : "application/octet-stream";
  }
}

/** Baseline library entries so Media Library is never blank on Vercel. */
export function buildSiteInUseMediaAssets(
  urls: Iterable<string> = SITE_IN_USE_MEDIA_URLS
): MediaAsset[] {
  const now = "2026-01-01T00:00:00.000Z";
  const byUrl = new Map<string, MediaAsset>();

  for (const raw of urls) {
    const url = raw.split("?")[0]?.split("#")[0] || raw;
    if (!url || byUrl.has(url)) continue;
    const mime = mimeFromUrl(url);
    const isVideo = mime.startsWith("video/");
    const isRemote = url.startsWith("http://") || url.startsWith("https://");
    byUrl.set(url, {
      id: `used-${slugId(url)}`,
      name: decodeURIComponent(url.split("/").pop() || "media"),
      url,
      type: isVideo ? "video" : "image",
      mimeType: mime,
      size: 0,
      folder: folderForUrl(url),
      tags: isRemote ? ["in-use", "remote"] : ["in-use", "site"],
      createdAt: now,
      updatedAt: now,
    });
  }

  return Array.from(byUrl.values()).sort((a, b) => a.name.localeCompare(b.name));
}
