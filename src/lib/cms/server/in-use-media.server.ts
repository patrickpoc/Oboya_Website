import "server-only";

import { getAboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import { getBlogPosts } from "@/lib/cms/repositories/blog-repository";
import { getCaseStudies } from "@/lib/cms/repositories/case-studies-repository";
import { getHomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { getCmsProducts } from "@/lib/cms/repositories/product-repository";
import { readHomepageSettingsDurable } from "@/lib/cms/server/homepage.server";
import {
  SITE_IN_USE_MEDIA_URLS,
  buildSiteInUseMediaAssets,
} from "@/lib/cms/site-media-urls";
import type { MediaAsset } from "@/lib/cms/types";

const MEDIA_URL_RE = /^(https?:\/\/|\/assets\/|\/uploads\/)/i;

function looksLikeMediaUrl(value: string): boolean {
  if (!MEDIA_URL_RE.test(value)) return false;
  if (value.startsWith("/api/")) return false;
  return true;
}

export function normalizeMediaUrl(url: string): string {
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

/** Collect normalized URLs currently wired into site/CMS elements. */
export async function collectInUseMediaUrls(): Promise<Set<string>> {
  const urls = new Set<string>();

  for (const url of SITE_IN_USE_MEDIA_URLS) {
    urls.add(normalizeMediaUrl(url));
  }

  try {
    collectFromValue(getHomepageSettings(), urls);
  } catch (error) {
    console.error("in-use media: homepage defaults skipped", error);
  }

  try {
    collectFromValue(await readHomepageSettingsDurable(), urls);
  } catch (error) {
    console.error("in-use media: homepage durable skipped", error);
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

export function assetsFromInUseUrls(
  urls: Set<string>,
  alreadyHave: Set<string>
): MediaAsset[] {
  const missing = [...urls].filter(
    (url) => !alreadyHave.has(normalizeMediaUrl(url))
  );
  return buildSiteInUseMediaAssets(missing);
}

export function baselineInUseMediaAssets(): MediaAsset[] {
  return buildSiteInUseMediaAssets();
}
