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
  hardDeleteProduct,
  persistProductsToFileSafe,
  restoreProduct,
  saveProduct,
  softDeleteProduct,
} from "@/lib/cms/server/products.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type WriteOptions = { deferRevalidate?: boolean; skipFileSync?: boolean };

async function revalidateShop(productId?: string) {
  try {
    const { revalidateShopPages } = await import("@/lib/cms/revalidate-site");
    revalidateShopPages(productId);
  } catch {
    // Ignore when revalidation is unavailable.
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
  const { persistProductWithContent } = await import(
    "@/lib/cms/server/product-content.server"
  );
  const saved = saveCmsProduct(
    await persistProductWithContent(product, previous ?? undefined)
  );
  if (isSupabaseConfigured()) {
    await saveProduct(saved);
  }
  if (!options.skipFileSync) await syncProductsFile();
  if (!options.deferRevalidate) await revalidateShop(saved.id);
  return saved;
}

export async function deleteProductWrite(
  id: string,
  hard: boolean,
  options: WriteOptions = {}
): Promise<void> {
  if (hard) hardDeleteCmsProduct(id);
  else softDeleteCmsProduct(id);
  if (isSupabaseConfigured()) {
    if (hard) await hardDeleteProduct(id);
    else await softDeleteProduct(id);
  }
  await syncProductsFile();
  if (!options.deferRevalidate) await revalidateShop(id);
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
  if (!options.deferRevalidate) await revalidateShop(id);
}

export { revalidateShop };
