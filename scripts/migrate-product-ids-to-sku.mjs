#!/usr/bin/env node
/**
 * One-shot migration: product.id → product.sku (and color variant.id → variant.sku).
 *
 * Usage:
 *   node scripts/migrate-product-ids-to-sku.mjs --dry-run
 *   node scripts/migrate-product-ids-to-sku.mjs
 *   node scripts/migrate-product-ids-to-sku.mjs --file=data/shop/products.json
 *
 * Writes:
 *   - data/shop/product-id-remap.json  (oldId → sku, oldVariantId → sku)
 *   - updates products JSON (when not using Supabase-only mode)
 *
 * Pre-checks:
 *   - every product has non-empty sku
 *   - no two products share the same sku
 *   - no collision where id of A == sku of B (unless A already migrated)
 *   - duplicate variant skus globally are reported
 *
 * Flags:
 *   --dry-run     Validate + print plan; do not write
 *   --file=PATH   Products JSON path (default data/shop/products.json)
 *   --backup      Write products.json.bak before mutating
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
const remapPath = path.join(rootDir, "data/shop/product-id-remap.json");

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function warn(message) {
  console.warn(`! ${message}`);
}

function info(message) {
  console.log(`• ${message}`);
}

if (!existsSync(productsPath)) {
  fail(`Products file not found: ${productsPath}`);
}

const products = JSON.parse(readFileSync(productsPath, "utf-8"));
if (!Array.isArray(products)) {
  fail("Products file must be a JSON array.");
}

info(`Loaded ${products.length} product(s) from ${path.relative(rootDir, productsPath)}`);
if (dryRun) info("DRY RUN — no files will be written.");

const errors = [];
const parentSkuOwners = new Map();
const allSkuOwners = new Map();

for (const product of products) {
  const sku = typeof product.sku === "string" ? product.sku.trim() : "";
  if (!sku) {
    errors.push(`Product ${product.id || "(missing id)"} has empty sku.`);
    continue;
  }
  const skuKey = sku.toLowerCase();
  const owners = parentSkuOwners.get(skuKey) ?? [];
  owners.push(product.id);
  parentSkuOwners.set(skuKey, owners);

  const register = (raw, ownerId) => {
    const key = String(raw || "")
      .trim()
      .toLowerCase();
    if (!key) return;
    const list = allSkuOwners.get(key) ?? [];
    list.push(ownerId);
    allSkuOwners.set(key, list);
  };
  register(sku, product.id);
  for (const variant of product.colorVariants ?? []) {
    register(variant.sku, `${product.id}::${variant.id}`);
  }
}

for (const [sku, owners] of parentSkuOwners) {
  if (owners.length > 1) {
    errors.push(`Duplicate parent SKU "${sku}" on products: ${owners.join(", ")}`);
  }
}

for (const [sku, owners] of allSkuOwners) {
  const uniqueOwners = Array.from(new Set(owners.map((o) => o.split("::")[0])));
  if (uniqueOwners.length > 1) {
    errors.push(
      `SKU "${sku}" claimed across products: ${owners.join(", ")}`
    );
  }
}

// id of A == sku of B (except already migrated A.id === A.sku)
for (const productA of products) {
  const idA = productA.id;
  if (!idA) {
    errors.push("Product missing id.");
    continue;
  }
  if (idA === productA.sku?.trim()) continue; // already migrated
  for (const productB of products) {
    if (productA.id === productB.id) continue;
    if ((productB.sku || "").trim() === idA) {
      errors.push(
        `Collision: id of "${productA.id}" equals sku of "${productB.id}".`
      );
    }
  }
}

if (errors.length > 0) {
  console.error("\nPre-check failed:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

info("Pre-checks passed.");

const productRemap = {};
const variantRemap = {};
const relatedRemapNeeded = new Set();

const migrated = products.map((product) => {
  const sku = product.sku.trim();
  const oldId = product.id;
  const next = structuredClone(product);

  if (oldId !== sku) {
    productRemap[oldId] = sku;
    relatedRemapNeeded.add(oldId);
    next.id = sku;
  }

  const imageColorIds = Array.isArray(next.imageColorIds)
    ? next.imageColorIds.map((slot) =>
        Array.isArray(slot)
          ? slot.map((colorId) => {
              if (!colorId || colorId === "__default__") return colorId;
              return colorId;
            })
          : []
      )
    : next.imageColorIds;

  next.colorVariants = (next.colorVariants ?? []).map((variant) => {
    const variantSku = typeof variant.sku === "string" ? variant.sku.trim() : "";
    if (!variantSku) return variant;
    if (variant.id === "__default__") return variant;
    if (variant.id !== variantSku) {
      variantRemap[variant.id] = variantSku;
      // Remap imageColorIds tags for this variant
      if (Array.isArray(imageColorIds)) {
        for (const slot of imageColorIds) {
          for (let i = 0; i < slot.length; i += 1) {
            if (slot[i] === variant.id) slot[i] = variantSku;
          }
        }
      }
      return { ...variant, id: variantSku, sku: variantSku };
    }
    return { ...variant, sku: variantSku };
  });

  next.imageColorIds = imageColorIds;
  return next;
});

// Remap relatedProductIds using productRemap
for (const product of migrated) {
  if (!Array.isArray(product.relatedProductIds)) continue;
  product.relatedProductIds = product.relatedProductIds.map(
    (id) => productRemap[id] ?? id
  );
}

info(
  `Will remap ${Object.keys(productRemap).length} product id(s) and ${Object.keys(variantRemap).length} variant id(s).`
);

if (Object.keys(productRemap).length === 0 && Object.keys(variantRemap).length === 0) {
  info("Nothing to migrate — all ids already match skus.");
}

const remapPayload = {
  generatedAt: new Date().toISOString(),
  products: productRemap,
  variants: variantRemap,
};

if (dryRun) {
  console.log("\nPlanned product remaps:");
  console.log(JSON.stringify(productRemap, null, 2));
  console.log("\nPlanned variant remaps:");
  console.log(JSON.stringify(variantRemap, null, 2));
  info("Dry run complete.");
  process.exit(0);
}

if (doBackup && existsSync(productsPath)) {
  const backupPath = `${productsPath}.bak`;
  copyFileSync(productsPath, backupPath);
  info(`Backup written: ${path.relative(rootDir, backupPath)}`);
}

writeFileSync(productsPath, `${JSON.stringify(migrated, null, 2)}\n`);
writeFileSync(remapPath, `${JSON.stringify(remapPayload, null, 2)}\n`);
info(`Updated ${path.relative(rootDir, productsPath)}`);
info(`Wrote ${path.relative(rootDir, remapPath)}`);

// Optional Supabase upsert when service role is configured
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (url && serviceKey) {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Change PK carefully: insert new rows then delete old ids when remapped
    for (const [oldId, newId] of Object.entries(productRemap)) {
      const product = migrated.find((item) => item.id === newId);
      if (!product) continue;
      const row = {
        id: product.id,
        sku: product.sku,
        moq: product.moq ?? 1,
        brand_id: product.brandId,
        category_id: product.categoryId,
        subcategory_id: product.subcategoryId,
        images: product.images ?? [],
        image_color_ids: product.imageColorIds ?? [],
        tags: product.tags ?? [],
        availability: product.availability ?? {},
        enabled_countries: product.enabledCountries ?? product.availability ?? {},
        prices: product.prices ?? {},
        application: product.application ?? [],
        cultures: product.cultures ?? [],
        certifications: product.certifications ?? [],
        country_of_origin: product.countryOfOrigin ?? "",
        stock_status: product.stockStatus ?? "in_stock",
        stock_quantity: product.stockQuantity ?? null,
        unlimited_stock: product.unlimitedStock ?? true,
        specs: product.specs ?? [],
        documents: product.documents ?? [],
        related_product_ids: product.relatedProductIds ?? [],
        default_color: product.defaultColor ?? "",
        default_color_name: product.defaultColorName ?? {},
        color_variants: product.colorVariants ?? [],
        name: product.name ?? {},
        short_description: product.shortDescription ?? {},
        description: product.description ?? {},
        status: product.status ?? "draft",
        seo: product.seo ?? {},
        deleted_at: product.deletedAt ?? null,
        purge_at: product.purgeAt ?? null,
      };
      const { error: upsertError } = await supabase.from("cms_products").upsert(row);
      if (upsertError) {
        warn(`Supabase upsert failed for ${newId}: ${upsertError.message}`);
        continue;
      }
      if (oldId !== newId) {
        const { error: deleteError } = await supabase
          .from("cms_products")
          .delete()
          .eq("id", oldId);
        if (deleteError) {
          warn(`Supabase delete old id ${oldId} failed: ${deleteError.message}`);
        }
      }
    }

    // Products already id===sku but variant remaps only
    for (const product of migrated) {
      if (productRemap[Object.keys(productRemap).find((k) => productRemap[k] === product.id)] ||
          Object.values(productRemap).includes(product.id)) {
        continue;
      }
      // Upsert remaining to persist variant id changes
      const touchedVariants = (product.colorVariants ?? []).some(
        (variant) => variantRemap[variant.id] || Object.values(variantRemap).includes(variant.id)
      );
      if (!touchedVariants) continue;
      const { error } = await supabase.from("cms_products").upsert({
        id: product.id,
        sku: product.sku,
        color_variants: product.colorVariants ?? [],
        image_color_ids: product.imageColorIds ?? [],
        related_product_ids: product.relatedProductIds ?? [],
      });
      if (error) warn(`Supabase variant update failed for ${product.id}: ${error.message}`);
    }

    info("Supabase sync attempted (see warnings above if any).");
  } catch (error) {
    warn(
      `Supabase sync skipped: ${error instanceof Error ? error.message : String(error)}`
    );
  }
} else {
  info("Supabase env not configured — JSON file only.");
}

info("Migration complete. Revalidate shop paths in the admin or redeploy.");
info("Cart hydrate reads data/shop/product-id-remap.json automatically.");
