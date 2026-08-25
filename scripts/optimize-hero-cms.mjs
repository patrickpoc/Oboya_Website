#!/usr/bin/env node
/**
 * Migrate oversized hero PNG into optimized upload variants and
 * point homepage-settings.json at the desktop WebP.
 */
import { readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// sharp is CJS-friendly via createRequire in this script context
const sharp = require("sharp");

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const heroSrc = path.join(
  root,
  "public/assets/homepage/hero-cms-live.png"
);
const homepageFile = path.join(root, "data/cms/homepage-settings.json");
const mediaFile = path.join(root, "data/cms/media-assets.json");
const assetId = "media-hero-cms-live";
const outDir = path.join(root, "public/uploads", assetId);

const WIDTHS = { thumb: 400, mobile: 1080, card: 1200, desktop: 1920 };

async function writeVariant(pipeline, filename, mimeType) {
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  await writeFile(path.join(outDir, filename), data);
  return {
    url: `/uploads/${assetId}/${filename}`,
    width: info.width,
    height: info.height,
    size: data.byteLength,
    mimeType,
  };
}

async function main() {
  await access(heroSrc);
  const { mkdir } = await import("node:fs/promises");
  await mkdir(outDir, { recursive: true });

  const buffer = await readFile(heroSrc);
  await writeFile(path.join(outDir, "original.png"), buffer);

  const meta = await sharp(buffer).metadata();
  const srcW = meta.width || 1920;

  const resize = (w) =>
    sharp(buffer)
      .rotate()
      .resize({
        width: Math.min(w, srcW),
        withoutEnlargement: true,
        fit: "inside",
      });

  const variants = {
    thumb: await writeVariant(
      resize(WIDTHS.thumb).webp({ quality: 75, effort: 4 }),
      "thumb.webp",
      "image/webp"
    ),
    mobile: await writeVariant(
      resize(WIDTHS.mobile).webp({ quality: 78, effort: 4 }),
      "mobile.webp",
      "image/webp"
    ),
    mobileAvif: await writeVariant(
      resize(WIDTHS.mobile).avif({ quality: 65, effort: 4 }),
      "mobile.avif",
      "image/avif"
    ),
    card: await writeVariant(
      resize(WIDTHS.card).webp({ quality: 78, effort: 4 }),
      "card.webp",
      "image/webp"
    ),
    desktop: await writeVariant(
      resize(WIDTHS.desktop).webp({ quality: 80, effort: 5 }),
      "desktop.webp",
      "image/webp"
    ),
    desktopAvif: await writeVariant(
      resize(WIDTHS.desktop).avif({ quality: 65, effort: 4 }),
      "desktop.avif",
      "image/avif"
    ),
    desktopJpeg: await writeVariant(
      resize(WIDTHS.desktop).jpeg({ quality: 82, mozjpeg: true }),
      "desktop.jpg",
      "image/jpeg"
    ),
  };

  const canonical = variants.desktop;
  const now = new Date().toISOString();
  const asset = {
    id: assetId,
    name: "hero-cms-live.png",
    url: canonical.url,
    type: "image",
    mimeType: canonical.mimeType,
    size: canonical.size,
    width: canonical.width,
    height: canonical.height,
    folder: "folder-root",
    tags: ["upload", "optimized", "homepage", "hero"],
    createdAt: now,
    updatedAt: now,
    optimizationStatus: "optimized",
    originalUrl: `/uploads/${assetId}/original.png`,
    originalSize: buffer.byteLength,
    originalMimeType: "image/png",
    format: "webp",
    variants,
  };

  let media = [];
  try {
    media = JSON.parse(await readFile(mediaFile, "utf-8"));
  } catch {
    media = [];
  }
  media = media.filter(
    (a) =>
      a.id !== assetId &&
      !String(a.url || "").includes("hero-cms-live") &&
      !String(a.url || "").includes("1787686445030")
  );
  media.unshift(asset);
  await writeFile(mediaFile, `${JSON.stringify(media, null, 2)}\n`);

  const homepage = JSON.parse(await readFile(homepageFile, "utf-8"));
  homepage.hero.backgroundImage = canonical.url;
  homepage.hero.image && delete homepage.hero.image;
  homepage.updatedAt = now;
  await writeFile(homepageFile, `${JSON.stringify(homepage, null, 2)}\n`);

  console.log(
    `OK: hero ${buffer.byteLength} → desktop WebP ${canonical.size} bytes (${canonical.width}x${canonical.height})`
  );
  console.log(`homepage.hero.backgroundImage = ${canonical.url}`);
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
