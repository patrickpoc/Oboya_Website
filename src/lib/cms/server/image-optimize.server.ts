import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Sharp } from "sharp";
import type {
  MediaAssetVariants,
  MediaImageFormat,
  MediaImageVariant,
  MediaOptimizationStatus,
} from "@/lib/cms/types";

/** Target max widths — never upscale. */
export const IMAGE_VARIANT_WIDTHS = {
  thumb: 400,
  mobile: 1080,
  card: 1200,
  desktop: 1920,
} as const;

const WEBP_QUALITY = {
  thumb: 75,
  mobile: 78,
  card: 78,
  desktop: 80,
} as const;

const AVIF_QUALITY = 65;
const JPEG_QUALITY = 82;

export type OptimizedImageResult = {
  status: MediaOptimizationStatus;
  url: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  format: MediaImageFormat;
  originalUrl: string;
  originalSize: number;
  originalMimeType: string;
  variants: MediaAssetVariants;
};

function publicUrl(...parts: string[]) {
  return `/uploads/${parts.join("/")}`;
}

async function writeVariant(
  pipeline: Sharp,
  outPath: string,
  url: string,
  mimeType: string
): Promise<MediaImageVariant> {
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  await writeFile(outPath, data);
  return {
    url,
    width: info.width,
    height: info.height,
    size: data.byteLength,
    mimeType,
  };
}

function shouldSkipRaster(mimeType: string, buffer: Buffer): boolean {
  if (mimeType === "image/svg+xml") return true;
  if (mimeType === "image/gif") {
    // Animated GIFs: skip raster pipeline (sharp would flatten).
    // Heuristic: multiple image descriptors → treat as animated.
    const asString = buffer.toString("binary");
    const frames = asString.split("\x00\x21\xF9\x04").length - 1;
    return frames > 1;
  }
  return false;
}

function formatFromMime(mimeType: string): MediaImageFormat {
  if (mimeType === "image/svg+xml") return "svg";
  if (mimeType === "image/gif") return "gif";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/avif") return "avif";
  return "jpeg";
}

/**
 * Optimize an uploaded image: strip metadata, generate responsive variants.
 * Layout: public/uploads/{assetId}/original.ext + thumb/mobile/desktop.*
 */
export async function optimizeImageUpload(options: {
  buffer: Buffer;
  assetId: string;
  originalFilename: string;
  mimeType: string;
}): Promise<OptimizedImageResult> {
  const { buffer, assetId, originalFilename, mimeType } = options;
  const uploadsRoot = path.join(process.cwd(), "public", "uploads", assetId);
  await mkdir(uploadsRoot, { recursive: true });

  const ext =
    path.extname(originalFilename).toLowerCase() ||
    (mimeType === "image/png"
      ? ".png"
      : mimeType === "image/webp"
        ? ".webp"
        : mimeType === "image/gif"
          ? ".gif"
          : mimeType === "image/svg+xml"
            ? ".svg"
            : ".jpg");

  const originalName = `original${ext}`;
  const originalPath = path.join(uploadsRoot, originalName);
  await writeFile(originalPath, buffer);
  const originalUrl = publicUrl(assetId, originalName);

  if (shouldSkipRaster(mimeType, buffer)) {
    return {
      status: "skipped",
      url: originalUrl,
      mimeType,
      size: buffer.byteLength,
      width: 0,
      height: 0,
      format: formatFromMime(mimeType),
      originalUrl,
      originalSize: buffer.byteLength,
      originalMimeType: mimeType,
      variants: {},
    };
  }

  try {
    const base = sharp(buffer, { failOn: "none" }).rotate();
    const meta = await base.metadata();
    const srcWidth = meta.width ?? 0;
    const srcHeight = meta.height ?? 0;
    if (!srcWidth || !srcHeight) {
      throw new Error("Unable to read image dimensions");
    }

    const variants: MediaAssetVariants = {};

    const makeResize = (maxWidth: number) => {
      const width = Math.min(maxWidth, srcWidth);
      return sharp(buffer, { failOn: "none" })
        .rotate()
        .resize({
          width,
          withoutEnlargement: true,
          fit: "inside",
        });
    };

    // Thumb (WebP only)
    variants.thumb = await writeVariant(
      makeResize(IMAGE_VARIANT_WIDTHS.thumb).webp({
        quality: WEBP_QUALITY.thumb,
        effort: 4,
      }),
      path.join(uploadsRoot, "thumb.webp"),
      publicUrl(assetId, "thumb.webp"),
      "image/webp"
    );

    // Mobile WebP + AVIF
    variants.mobile = await writeVariant(
      makeResize(IMAGE_VARIANT_WIDTHS.mobile).webp({
        quality: WEBP_QUALITY.mobile,
        effort: 4,
      }),
      path.join(uploadsRoot, "mobile.webp"),
      publicUrl(assetId, "mobile.webp"),
      "image/webp"
    );
    variants.mobileAvif = await writeVariant(
      makeResize(IMAGE_VARIANT_WIDTHS.mobile).avif({
        quality: AVIF_QUALITY,
        effort: 4,
      }),
      path.join(uploadsRoot, "mobile.avif"),
      publicUrl(assetId, "mobile.avif"),
      "image/avif"
    );

    // Card WebP (mid-size for section cards)
    variants.card = await writeVariant(
      makeResize(IMAGE_VARIANT_WIDTHS.card).webp({
        quality: WEBP_QUALITY.card,
        effort: 4,
      }),
      path.join(uploadsRoot, "card.webp"),
      publicUrl(assetId, "card.webp"),
      "image/webp"
    );

    // Desktop WebP + AVIF + JPEG fallback
    variants.desktop = await writeVariant(
      makeResize(IMAGE_VARIANT_WIDTHS.desktop).webp({
        quality: WEBP_QUALITY.desktop,
        effort: 5,
      }),
      path.join(uploadsRoot, "desktop.webp"),
      publicUrl(assetId, "desktop.webp"),
      "image/webp"
    );
    variants.desktopAvif = await writeVariant(
      makeResize(IMAGE_VARIANT_WIDTHS.desktop).avif({
        quality: AVIF_QUALITY,
        effort: 4,
      }),
      path.join(uploadsRoot, "desktop.avif"),
      publicUrl(assetId, "desktop.avif"),
      "image/avif"
    );
    variants.desktopJpeg = await writeVariant(
      makeResize(IMAGE_VARIANT_WIDTHS.desktop).jpeg({
        quality: JPEG_QUALITY,
        mozjpeg: true,
      }),
      path.join(uploadsRoot, "desktop.jpg"),
      publicUrl(assetId, "desktop.jpg"),
      "image/jpeg"
    );

    const canonical = variants.desktop ?? variants.card ?? variants.mobile ?? variants.thumb;
    if (!canonical) {
      throw new Error("No variants generated");
    }

    return {
      status: "optimized",
      url: canonical.url,
      mimeType: canonical.mimeType,
      size: canonical.size,
      width: canonical.width,
      height: canonical.height,
      format: "webp",
      originalUrl,
      originalSize: buffer.byteLength,
      originalMimeType: mimeType,
      variants,
    };
  } catch (error) {
    console.error("Image optimization failed:", error);
    return {
      status: "failed",
      url: originalUrl,
      mimeType,
      size: buffer.byteLength,
      width: 0,
      height: 0,
      format: formatFromMime(mimeType),
      originalUrl,
      originalSize: buffer.byteLength,
      originalMimeType: mimeType,
      variants: {},
    };
  }
}

/**
 * Re-optimize an existing file on disk (migration / backfill).
 */
export async function optimizeExistingFile(options: {
  absolutePath: string;
  assetId: string;
  originalFilename: string;
  mimeType: string;
}): Promise<OptimizedImageResult> {
  const { readFile } = await import("node:fs/promises");
  const buffer = await readFile(options.absolutePath);
  return optimizeImageUpload({
    buffer,
    assetId: options.assetId,
    originalFilename: options.originalFilename,
    mimeType: options.mimeType,
  });
}
