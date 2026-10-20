import "server-only";

import { readFile } from "node:fs/promises";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { writeLocalJsonFile } from "@/lib/cms/server/local-fs.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  PRODUCTS_FILE,
  disableFeaturedColorColumn,
  featuredColorColumnIsAvailable,
  isMissingFeaturedColorColumn,
  productToRow,
} from "@/lib/cms/server/products/row.server";

export async function saveProduct(product: CmsProduct) {
  if (!isSupabaseConfigured()) {
    return product;
  }
  const supabase = await createClient();
  let { error } = await supabase.from("cms_products").upsert(productToRow(product));
  if (isMissingFeaturedColorColumn(error) && featuredColorColumnIsAvailable()) {
    disableFeaturedColorColumn();
    ({ error } = await supabase.from("cms_products").upsert(productToRow(product)));
  }
  if (error) throw new Error(`Failed to save product: ${error.message}`);
  return product;
}

export async function softDeleteProduct(id: string) {
  if (!isSupabaseConfigured()) {
    return;
  }
  const supabase = await createClient();
  const now = new Date();
  const purgeAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("cms_products")
    .update({ deleted_at: now.toISOString(), purge_at: purgeAt })
    .eq("id", id);
  if (error) throw new Error(`Failed to delete product: ${error.message}`);
}

export async function restoreProduct(id: string) {
  if (!isSupabaseConfigured()) {
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("cms_products")
    .update({ deleted_at: null, purge_at: null })
    .eq("id", id);
  if (error) throw new Error(`Failed to restore product: ${error.message}`);
}

export async function hardDeleteProduct(id: string) {
  if (!isSupabaseConfigured()) {
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("cms_products").delete().eq("id", id);
  if (error) throw new Error(`Failed to hard delete product: ${error.message}`);
}

export async function persistProductsToFile(products: CmsProduct[]) {
  if (isSupabaseConfigured()) {
    return;
  }
  await writeLocalJsonFile(PRODUCTS_FILE, products);
}

export async function persistProductsToFileSafe(products: CmsProduct[]) {
  if (isSupabaseConfigured()) {
    return;
  }
  try {
    await persistProductsToFile(products);
  } catch (error) {
    if (
      error instanceof Error &&
      /read-only filesystem|Configure Supabase/i.test(error.message)
    ) {
      return;
    }
    throw error;
  }
}

export async function readProductsFromFile() {
  const raw = await readFile(PRODUCTS_FILE, "utf-8");
  return JSON.parse(raw) as CmsProduct[];
}


