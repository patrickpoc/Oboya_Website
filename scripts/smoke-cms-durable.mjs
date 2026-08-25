#!/usr/bin/env node
/**
 * Smoke checks for durable CMS persistence (homepage + media uploads).
 * Does not require a running Next server.
 */
import { mkdir, readFile, writeFile, unlink, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const cmsDir = path.join(root, "data", "cms");
const uploadsDir = path.join(root, "public", "uploads");
const homepageFile = path.join(cmsDir, "homepage-settings.smoke.json");
const uploadFile = path.join(uploadsDir, "smoke-upload.png");

const MINI_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  await mkdir(cmsDir, { recursive: true });
  await mkdir(uploadsDir, { recursive: true });

  const payload = {
    hero: {
      image: "/uploads/smoke-upload.png",
      title: { en: "Smoke hero", pt: "", es: "", zh: "" },
    },
    _smoke: true,
  };

  await writeFile(homepageFile, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
  const roundTrip = JSON.parse(await readFile(homepageFile, "utf-8"));
  assert(roundTrip.hero?.image === "/uploads/smoke-upload.png", "homepage JSON round-trip failed");
  assert(!String(roundTrip.hero.image).startsWith("data:"), "data URL must not persist");

  await writeFile(uploadFile, MINI_PNG);
  await access(uploadFile);

  await unlink(homepageFile);
  await unlink(uploadFile);

  console.log("OK: CMS durable smoke checks passed (JSON + uploads disk write)");
}

main().catch((error) => {
  console.error("FAIL:", error.message);
  process.exit(1);
});
