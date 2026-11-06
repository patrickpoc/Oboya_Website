import "server-only";

import { readFile } from "node:fs/promises";
import { getCmsProducts, type CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { ReferencePatch } from "@/lib/cms/taxonomy-removal";
import { rethrowNextSignals } from "@/lib/cms/server/rethrow-next-signals";
import { writeLocalJsonFile } from "@/lib/cms/server/local-fs.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  PRODUCTS_FILE,
  OPTIONAL_COLUMN_RETRIES,
  disableMissingOptionalColumn,
  productToRow,
} from "@/lib/cms/server/products/row.server";

export async function saveProduct(product: CmsProduct) {
  if (!isSupabaseConfigured()) {
    return product;
  }
  const supabase = await createClient();
  let { error } = await supabase.from("cms_products").upsert(productToRow(product));
  for (let i = 0; i < OPTIONAL_COLUMN_RETRIES && disableMissingOptionalColumn(error); i++) {
    ({ error } = await supabase.from("cms_products").upsert(productToRow(product)));
  }
  if (error) throw new Error(`Failed to save product: ${error.message}`);
  return product;
}

export type ProductReferencePatch = ReferencePatch;

/** `customFilters` has no column (not persisted in Supabase), so it is omitted here. */
const REFERENCE_COLUMNS: Partial<Record<keyof ProductReferencePatch, string>> = {
  categoryId: "category_id",
  subcategoryId: "subcategory_id",
  brandId: "brand_id",
  application: "application",
  cultures: "cultures",
  certifications: "certifications",
  countryOfOrigin: "country_of_origin",
};

type UpdateResult = { updated: string[]; failed: Array<{ id: string; error: string }> };

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

/**
 * Applies one column patch per product in batches, counting an error or a
 * zero-row result (RLS) as a failure. Never throws: callers get `{updated, failed}`.
 */
async function updateProductColumns(
  updates: Array<{ id: string; columns: Record<string, unknown> }>
): Promise<UpdateResult> {
  const updated: string[] = [];
  const failed: UpdateResult["failed"] = [];
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch (error) {
    rethrowNextSignals(error);
    return {
      updated,
      failed: updates.map(({ id }) => ({ id, error: errorText(error) })),
    };
  }
  const batchSize = 10;
  for (let i = 0; i < updates.length; i += batchSize) {
    await Promise.all(
      updates.slice(i, i + batchSize).map(async ({ id, columns }) => {
        try {
          if (Object.keys(columns).length === 0) {
            updated.push(id);
            return;
          }
          const { data, error } = await supabase
            .from("cms_products")
            .update(columns)
            .eq("id", id)
            .select("id");
          if (error) failed.push({ id, error: error.message });
          else if ((data?.length ?? 0) === 0) failed.push({ id, error: "No row updated" });
          else updated.push(id);
        } catch (error) {
          rethrowNextSignals(error);
          failed.push({ id, error: errorText(error) });
        }
      })
    );
  }
  return { updated, failed };
}

/**
 * Updates only the taxonomy reference columns, so heavy columns the caller
 * never loaded (description, ...) are left untouched. Reports per-product
 * failures instead of aborting the batch.
 */
export async function updateProductReferences(
  updates: Array<{ id: string; patch: ProductReferencePatch }>
): Promise<UpdateResult> {
  if (!isSupabaseConfigured()) {
    const updated: string[] = [];
    const failed: UpdateResult["failed"] = [];
    const local = new Map(getCmsProducts({ includeDeleted: true }).map((p) => [p.id, p]));
    for (const { id, patch } of updates) {
      const product = local.get(id);
      if (!product) {
        failed.push({ id, error: "Product not found" });
        continue;
      }
      Object.assign(product, patch);
      updated.push(id);
    }
    if (updated.length > 0) {
      try {
        await persistProductsToFileSafe(getCmsProducts({ includeDeleted: true }));
      } catch (error) {
        // Memory changed but disk did not: report every row as not persisted.
        return {
          updated: [],
          failed: [...failed, ...updated.map((id) => ({ id, error: errorText(error) }))],
        };
      }
    }
    return { updated, failed };
  }

  return updateProductColumns(
    updates.map(({ id, patch }) => ({
      id,
      columns: Object.fromEntries(
        (Object.keys(patch) as Array<keyof ProductReferencePatch>).flatMap((key) => {
          const column = REFERENCE_COLUMNS[key];
          return column ? [[column, patch[key]]] : [];
        })
      ),
    }))
  );
}

/** Updates only `prices`; every other column (description, ...) is left untouched. */
export async function updateProductPrices(
  updates: Array<{ id: string; prices: CmsProduct["prices"] }>
): Promise<UpdateResult> {
  if (!isSupabaseConfigured()) {
    const updated: string[] = [];
    const failed: UpdateResult["failed"] = [];
    const local = new Map(getCmsProducts({ includeDeleted: true }).map((p) => [p.id, p]));
    for (const { id, prices } of updates) {
      const product = local.get(id);
      if (!product) failed.push({ id, error: "Product not found" });
      else {
        product.prices = prices;
        updated.push(id);
      }
    }
    return { updated, failed };
  }
  return updateProductColumns(updates.map(({ id, prices }) => ({ id, columns: { prices } })));
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


