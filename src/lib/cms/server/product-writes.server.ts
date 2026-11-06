import "server-only";

import {
  getCmsProducts,
  hardDeleteCmsProduct,
  restoreCmsProduct,
  saveCmsProduct,
  softDeleteCmsProduct,
  type CmsProduct,
} from "@/lib/cms/repositories/product-repository";
import {
  findExistingProduct,
  hardDeleteProduct,
  persistProductsToFileSafe,
  readProductsStrict,
  restoreProduct,
  saveProduct,
  softDeleteProduct,
} from "@/lib/cms/server/products.server";
import { colorDataChanged, findVariantProblem, variantShapeProblem } from "@/lib/cms/bulk-update/variant-guard";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  invalidateCatalog,
  invalidateProducts,
} from "@/lib/cms/server/cache-invalidation.server";

/**
 * `deferRevalidate`: batch writers (bulk update/import) still bust each
 * product's own pages, but leave the shared catalog tag for one final
 * `invalidateCatalog()` after the batch.
 */
type WriteOptions = { deferRevalidate?: boolean; skipFileSync?: boolean };

function invalidateWritten(
  keys: Array<string | null | undefined>,
  options: WriteOptions
) {
  invalidateProducts(keys, { catalog: !options.deferRevalidate });
}

/** Resolve id → sku before delete/restore so the SKU-addressed PDP is busted too. */
async function productKeys(id: string): Promise<string[]> {
  try {
    const existing = await findExistingProduct(id, id);
    return [id, existing?.id ?? "", existing?.sku ?? ""];
  } catch {
    return [id];
  }
}

export async function syncProductsFile() {
  await persistProductsToFileSafe(getCmsProducts({ includeDeleted: true }));
}

export async function writeProduct(
  product: CmsProduct,
  previous: CmsProduct | null | undefined,
  options: WriteOptions = {}
): Promise<CmsProduct> {
  const { persistProductWithContent, reconcileProductImages } = await import(
    "@/lib/cms/server/product-content.server"
  );
  // Stale client payloads carry `deletedAt: null`: only restore may clear trash.
  const pinned = {
    ...product,
    deletedAt: previous?.deletedAt ?? null,
    purgeAt: previous?.purgeAt ?? null,
  };
  const saved = saveCmsProduct(await persistProductWithContent(pinned));
  if (isSupabaseConfigured()) {
    await saveProduct(saved);
  }
  if (!options.skipFileSync) await syncProductsFile();
  invalidateWritten([saved.id, saved.sku, previous?.id, previous?.sku], options);
  // Only after the upsert succeeded; never fails the save.
  await reconcileProductImages(previous, saved);
  return saved;
}

/**
 * Update payloads may omit fields (bulk update never sends the long description);
 * omitted keys keep the stored value instead of being wiped.
 */
export function mergeProductUpdate(
  incoming: Partial<CmsProduct> & Pick<CmsProduct, "id">,
  previous: CmsProduct | null | undefined
): CmsProduct {
  return (
    previous
      ? {
          ...previous,
          ...incoming,
          deletedAt: previous.deletedAt ?? null,
          purgeAt: previous.purgeAt ?? null,
        }
      : { ...incoming, deletedAt: null, purgeAt: null }
  ) as CmsProduct;
}

export class VariantValidationError extends Error {
  constructor(
    message: string,
    readonly productId: string,
    readonly sku: string
  ) {
    super(message);
    this.name = "VariantValidationError";
  }
}

/**
 * Rejects an invalid or colliding color-variant change (bad hex/name/image/sort order,
 * duplicate SKU, SKU owned by another product, trashed included). Items whose color data is
 * unchanged are skipped, so a legacy invalid product still saves. Within a batch the other
 * pending documents count as owners too. Stored products are read once, and only if needed.
 */
export async function assertVariantChangesValid(
  items: Array<{ incoming: CmsProduct; previous: CmsProduct | null | undefined }>
): Promise<void> {
  for (const { incoming, previous } of items) {
    const shape = variantShapeProblem(incoming, previous);
    if (shape) throw new VariantValidationError(shape, incoming.id, incoming.sku);
  }
  const checked = items.filter(
    ({ incoming, previous }) =>
      (incoming.colorVariants?.length ?? 0) > 0 && colorDataChanged(incoming, previous)
  );
  if (checked.length === 0) return;
  const stored = await readProductsStrict();
  const batch = items.map((item) => item.incoming);
  const batchIds = new Set(batch.map((product) => product.id));
  const others = [...stored.filter((product) => !batchIds.has(product.id)), ...batch];
  for (const { incoming, previous } of checked) {
    const problem = findVariantProblem(incoming, previous, others);
    if (problem) throw new VariantValidationError(problem, incoming.id, incoming.sku);
  }
}

export class ProductExistsError extends Error {
  constructor(sku: string) {
    super(`A product with SKU ${sku} already exists (including trash). Use a different SKU or edit the existing product.`);
    this.name = "ProductExistsError";
  }
}

export async function assertProductIsNew(product: Pick<CmsProduct, "id" | "sku">) {
  const existing = await findExistingProduct(product.id, product.sku);
  if (existing) throw new ProductExistsError(existing.sku || existing.id);
}

export async function createProductWrite(
  product: CmsProduct,
  options: WriteOptions = {}
): Promise<CmsProduct> {
  await assertProductIsNew(product);
  return writeProduct(product, null, options);
}

export async function deleteProductWrite(
  id: string,
  hard: boolean,
  options: WriteOptions = {}
): Promise<void> {
  const keys = isSupabaseConfigured() ? await productKeys(id) : [id];
  if (hard) hardDeleteCmsProduct(id);
  else softDeleteCmsProduct(id);
  if (isSupabaseConfigured()) {
    if (hard) await hardDeleteProduct(id);
    else await softDeleteProduct(id);
  }
  await syncProductsFile();
  invalidateWritten(keys, options);
}

export async function restoreProductWrite(
  id: string,
  options: WriteOptions = {}
): Promise<void> {
  restoreCmsProduct(id);
  if (isSupabaseConfigured()) {
    await restoreProduct(id);
  }
  await syncProductsFile();
  invalidateWritten(isSupabaseConfigured() ? await productKeys(id) : [id], options);
}

export { invalidateCatalog };
