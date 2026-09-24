#!/usr/bin/env node
/**
 * One-shot migration: set product.moq and every colorVariants[].moq to 1.
 *
 * Usage:
 *   node scripts/migrate-moq-to-one.mjs --dry-run
 *   node scripts/migrate-moq-to-one.mjs
 *   node scripts/migrate-moq-to-one.mjs --file=data/shop/products.json
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filename) {
  const filePath = path.join(rootDir, filename);
  if (!existsSync(filePath)) return;
  const contents = readFileSync(filePath, "utf-8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const doBackup = args.includes("--backup") || !dryRun;
const fileArg = args.find((arg) => arg.startsWith("--file="));
const productsPath = path.resolve(
  rootDir,
  fileArg ? fileArg.slice("--file=".length) : "data/shop/products.json"
);

function info(message) {
  console.log(`• ${message}`);
}

function warn(message) {
  console.warn(`! ${message}`);
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function normalizeMoq(product) {
  let productChanged = Number(product.moq) !== 1;
  let variantsChanged = 0;
  const next = {
    ...product,
    moq: 1,
    colorVariants: Array.isArray(product.colorVariants)
      ? product.colorVariants.map((variant) => {
          if (!variant || typeof variant !== "object") return variant;
          if (Number(variant.moq) !== 1) variantsChanged += 1;
          return { ...variant, moq: 1 };
        })
      : product.colorVariants,
  };
  return { next, productChanged, variantsChanged };
}

async function migrateJsonFile() {
  if (!existsSync(productsPath)) {
    warn(`Products file not found: ${productsPath}`);
    return [];
  }

  const products = JSON.parse(readFileSync(productsPath, "utf-8"));
  if (!Array.isArray(products)) fail("Products file must be a JSON array.");

  let productsTouched = 0;
  let variantsTouched = 0;
  const migrated = products.map((product) => {
    const { next, productChanged, variantsChanged } = normalizeMoq(product);
    if (productChanged) productsTouched += 1;
    variantsTouched += variantsChanged;
    return next;
  });

  info(
    `JSON: ${productsTouched} product moq(s) and ${variantsTouched} variant moq(s) → 1 (${products.length} total).`
  );

  if (dryRun) {
    info("Dry run — JSON not written.");
    return migrated;
  }

  if (doBackup && products.length > 0) {
    const backupPath = `${productsPath}.bak`;
    copyFileSync(productsPath, backupPath);
    info(`Backup written: ${path.relative(rootDir, backupPath)}`);
  }

  writeFileSync(productsPath, `${JSON.stringify(migrated, null, 2)}\n`);
  info(`Updated ${path.relative(rootDir, productsPath)}`);
  return migrated;
}

async function migrateSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    info("Supabase env not configured — skipping remote.");
    return;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("cms_products")
    .select("id, sku, moq, color_variants");

  if (error) fail(`Supabase fetch failed: ${error.message}`);

  const rows = data ?? [];
  let productsTouched = 0;
  let variantsTouched = 0;

  for (const row of rows) {
    const variants = Array.isArray(row.color_variants) ? row.color_variants : [];
    const productNeeds = Number(row.moq) !== 1;
    let nextVariants = variants;
    let localVariantChanges = 0;

    if (variants.length > 0) {
      nextVariants = variants.map((variant) => {
        if (!variant || typeof variant !== "object") return variant;
        if (Number(variant.moq) !== 1) localVariantChanges += 1;
        return { ...variant, moq: 1 };
      });
    }

    if (!productNeeds && localVariantChanges === 0) continue;

    productsTouched += productNeeds ? 1 : 0;
    variantsTouched += localVariantChanges;

    if (dryRun) continue;

    const { error: updateError } = await supabase
      .from("cms_products")
      .update({ moq: 1, color_variants: nextVariants })
      .eq("id", row.id);

    if (updateError) {
      warn(`Supabase update failed for ${row.sku || row.id}: ${updateError.message}`);
    }
  }

  info(
    `Supabase: ${productsTouched} product moq(s) and ${variantsTouched} variant moq(s) → 1 (${rows.length} rows).`
  );
  if (dryRun) info("Dry run — Supabase not written.");
}

const fromFile = await migrateJsonFile();
await migrateSupabase();
info(
  dryRun
    ? "Dry run complete."
    : `Migration complete (${fromFile.length} local product(s) considered).`
);
