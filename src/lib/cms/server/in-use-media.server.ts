import "server-only";

import { homepageImages } from "@/constants/homepage-images";
import { getAboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import { getBlogPosts } from "@/lib/cms/repositories/blog-repository";
import { getCaseStudies } from "@/lib/cms/repositories/case-studies-repository";
import { getCmsProducts } from "@/lib/cms/repositories/product-repository";
import { readHomepageSettingsDurable } from "@/lib/cms/server/homepage.server";
import type { MediaAsset } from "@/lib/cms/types";

/** Paths referenced directly in React (not only via CMS JSON). */
const HARDCODED_SITE_MEDIA = [
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

const MEDIA_URL_RE =
  /^(https?:\/\/|\/assets\/|\/uploads\/)/i;

function looksLikeMediaUrl(value: string): boolean {
  if (!MEDIA_URL_RE.test(value)) return false;
  // Skip obvious non-media paths
  if (value.startsWith("/api/")) return false;
  return true;
}

function normalizeMediaUrl(url: string): string {
  const trimmed = url.trim();
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const parsed = new URL(trimmed);
      return `${parsed.origin}${parsed.pathname}`;
    }
  } catch {
    /* keep raw */
  }
  return trimmed.split("?")[0]?.split("#")[0] || trimmed;
}

function collectFromValue(value: unknown, into: Set<string>) {
  if (typeof value === "string") {
    if (looksLikeMediaUrl(value)) into.add(normalizeMediaUrl(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectFromValue(item, into);
    return;
  }
  if (value && typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      collectFromValue(nested, into);
    }
  }
}

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

/** Collect normalized URLs currently wired into site/CMS elements. */
export async function collectInUseMediaUrls(): Promise<Set<string>> {
  const urls = new Set<string>();

  for (const url of HARDCODED_SITE_MEDIA) {
    urls.add(normalizeMediaUrl(url));
  }

  try {
    collectFromValue(await readHomepageSettingsDurable(), urls);
  } catch (error) {
    console.error("in-use media: homepage skipped", error);
  }

  try {
    collectFromValue(getAboutPageSettings(), urls);
  } catch (error) {
    console.error("in-use media: about skipped", error);
  }

  try {
    collectFromValue(getBlogPosts(), urls);
  } catch (error) {
    console.error("in-use media: blog skipped", error);
  }

  try {
    collectFromValue(getCaseStudies(), urls);
  } catch (error) {
    console.error("in-use media: case studies skipped", error);
  }

  try {
    collectFromValue(getCmsProducts(), urls);
  } catch (error) {
    console.error("in-use media: products skipped", error);
  }

  return urls;
}

export function isUrlInUse(url: string, inUse: Set<string>): boolean {
  return inUse.has(normalizeMediaUrl(url));
}

/** Build MediaAsset entries for in-use URLs missing from disk/DB (needed on Vercel). */
export function assetsFromInUseUrls(
  urls: Set<string>,
  alreadyHave: Set<string>
): MediaAsset[] {
  const assets: MediaAsset[] = [];
  const now = "2026-01-01T00:00:00.000Z";

  for (const url of urls) {
    if (alreadyHave.has(normalizeMediaUrl(url))) continue;

    const mime = mimeFromUrl(url);
    const isVideo = mime.startsWith("video/");
    const name = decodeURIComponent(
      url.split("/").pop()?.split("?")[0] || "media"
    );
    const isRemote = url.startsWith("http://") || url.startsWith("https://");

    assets.push({
      id: `used-${slugId(url)}`,
      name,
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

  return assets;
}

export { normalizeMediaUrl };
