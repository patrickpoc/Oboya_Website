import "server-only";

import { getCmsProducts } from "@/lib/cms/repositories/product-repository";
import { readHomepageSettingsDurable } from "@/lib/cms/server/homepage.server";
import { readAboutPageSettingsDurable } from "@/lib/cms/server/about-page.server";
import { readBlogPostsDurable } from "@/lib/cms/server/blog-posts.server";
import { readCaseStudiesDurable } from "@/lib/cms/server/case-studies.server";
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

  // Prefer live CMS content over hardcoded seed lists so unused assets stay out.
  try {
    collectFromValue(await readHomepageSettingsDurable(), urls);
  } catch (error) {
    console.error("in-use media: homepage durable skipped", error);
  }

  try {
    collectFromValue(await readAboutPageSettingsDurable(), urls);
  } catch (error) {
    console.error("in-use media: about skipped", error);
  }

  try {
    collectFromValue(await readBlogPostsDurable(), urls);
  } catch (error) {
    console.error("in-use media: blog skipped", error);
  }

  try {
    collectFromValue(await readCaseStudiesDurable(), urls);
  } catch (error) {
    console.error("in-use media: case studies skipped", error);
  }

  try {
    collectFromValue(getCmsProducts(), urls);
  } catch (error) {
    console.error("in-use media: products skipped", error);
  }

  // Brand/logo fallbacks only if nothing else resolved (avoid empty picker).
  if (urls.size === 0) {
    for (const url of SITE_IN_USE_MEDIA_URLS) {
      urls.add(normalizeMediaUrl(url));
    }
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
