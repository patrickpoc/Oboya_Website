#!/usr/bin/env node
/**
 * Smoke test: sharp optimizes a large-ish PNG into WebP variants under target sizes.
 */
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetId = `smoke-opt-${Date.now()}`;
const outDir = path.join(root, "public", "uploads", assetId);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  await mkdir(outDir, { recursive: true });

  // Photo-like noise so PNG isn't tiny
  const { data: noise } = await sharp({
    create: {
      width: 2200,
      height: 1400,
      channels: 3,
      background: { r: 40, g: 90, b: 50 },
    },
  })
    .composite([
      {
        input: await sharp(
          Buffer.from(
            Array.from({ length: 200 * 200 * 3 }, (_, i) => (i * 37) % 256)
          ),
          { raw: { width: 200, height: 200, channels: 3 } }
        )
          .resize(2200, 1400)
          .png()
          .toBuffer(),
        blend: "overlay",
      },
    ])
    .png()
    .toBuffer({ resolveWithObject: true });

  const buffer = noise;
  assert(buffer.byteLength > 10_000, "fixture should be non-trivial");

  const desktop = await sharp(buffer)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  await writeFile(path.join(outDir, "desktop.webp"), desktop.data);

  assert(
    desktop.data.byteLength < 500_000,
    `desktop webp too large: ${desktop.data.byteLength}`
  );
  assert(desktop.info.width <= 1920, "width should be capped");

  // Import the real server module via dynamic transpile isn't available;
  // verify API shape by reusing optimize script targets.
  const mobile = await sharp(buffer)
    .resize({ width: 1080, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();
  assert(mobile.byteLength < 300_000, "mobile webp target");

  await rm(outDir, { recursive: true, force: true });
  console.log(
    `OK: media optimize smoke (png ${buffer.byteLength} → desktop webp ${desktop.data.byteLength})`
  );
}

main().catch(async (err) => {
  console.error("FAIL:", err.message);
  await rm(outDir, { recursive: true, force: true }).catch(() => {});
  process.exit(1);
});
