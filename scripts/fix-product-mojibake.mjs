#!/usr/bin/env node
/**
 * One-shot repair: undo UTF-8 text that was decoded as Latin-1 / Windows-1252
 * by the old CSV bulk import (e.g. "acrÃ­lica" → "acrílica").
 *
 * Only strings that round-trip to valid UTF-8 are rewritten; anything else is
 * left untouched, so running it twice is safe.
 *
 * Usage:
 *   node scripts/fix-product-mojibake.mjs --dry-run
 *   node scripts/fix-product-mojibake.mjs
 *   node scripts/fix-product-mojibake.mjs --sku=ABC-123 --dry-run
 */

import { readFileSync, existsSync } from "node:fs";
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
const skuArg = args.find((arg) => arg.startsWith("--sku="));
const onlySku = skuArg ? skuArg.slice("--sku=".length) : null;

const TEXT_COLUMNS = ["name", "short_description", "description", "seo"];

// Windows-1252 code points in 0x80–0x9F that differ from Latin-1.
const CP1252_TO_BYTE = new Map(
  [
    [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84],
    [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88],
    [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c],
    [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93],
    [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
    [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b],
    [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f],
  ]
);

const utf8 = new TextDecoder("utf-8", { fatal: true });

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

/** Returns the repaired string, or null when the value is not mojibake. */
function repairString(value) {
  if (!/[\u0080-ÿ]/.test(value)) return null;
  const bytes = [];
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code <= 0xff) bytes.push(code);
    else if (CP1252_TO_BYTE.has(code)) bytes.push(CP1252_TO_BYTE.get(code));
    else return null;
  }
  let decoded;
  try {
    decoded = utf8.decode(Uint8Array.from(bytes));
  } catch {
    return null;
  }
  return decoded === value ? null : decoded;
}

function repairValue(value, changes, keyPath) {
  if (typeof value === "string") {
    const fixed = repairString(value);
    if (fixed === null) return value;
    changes.push({ keyPath, before: value, after: fixed });
    return fixed;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => repairValue(item, changes, `${keyPath}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        repairValue(item, changes, `${keyPath}.${key}`),
      ])
    );
  }
  return value;
}

function preview(text) {
  const flat = text.replace(/\s+/g, " ");
  return flat.length > 80 ? `${flat.slice(0, 77)}...` : flat;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) fail("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let query = supabase.from("cms_products").select(`id, sku, ${TEXT_COLUMNS.join(", ")}`);
if (onlySku) query = query.eq("sku", onlySku);
const { data, error } = await query;
if (error) fail(`Supabase fetch failed: ${error.message}`);

const rows = data ?? [];
let rowsTouched = 0;
let fieldsTouched = 0;

for (const row of rows) {
  const changes = [];
  const update = {};
  for (const column of TEXT_COLUMNS) {
    const before = row[column];
    const columnChanges = [];
    const after = repairValue(before, columnChanges, column);
    if (columnChanges.length) {
      update[column] = after;
      changes.push(...columnChanges);
    }
  }
  if (!changes.length) continue;

  rowsTouched += 1;
  fieldsTouched += changes.length;
  info(`${row.sku || row.id}`);
  for (const change of changes) {
    console.log(`    ${change.keyPath}: "${preview(change.before)}" → "${preview(change.after)}"`);
  }

  if (dryRun) continue;
  const { error: updateError } = await supabase
    .from("cms_products")
    .update(update)
    .eq("id", row.id);
  if (updateError) warn(`Update failed for ${row.sku || row.id}: ${updateError.message}`);
}

info(`${fieldsTouched} field(s) in ${rowsTouched} of ${rows.length} product(s) need repair.`);
info(dryRun ? "Dry run — nothing written." : "Repair complete.");
