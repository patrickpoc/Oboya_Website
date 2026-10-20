import "server-only";

import {
  getCmsProducts,
  isProductPurgeDue,
  purgeExpiredCmsProducts,
  type CmsProduct,
} from "@/lib/cms/repositories/product-repository";
import { rethrowNextSignals } from "@/lib/cms/server/rethrow-next-signals";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";
import { logCmsPerf } from "@/lib/cms/server/perf-log.server";
import {
  CATALOG_READ_TAGS,
  FEATURED_COLOR_COLUMN,
  PRODUCT_LIST_COLUMNS,
  PRODUCT_TABLE_COLUMNS,
  disableFeaturedColorColumn,
  featuredColorColumnIsAvailable,
  isMissingFeaturedColorColumn,
  rowToProduct,
  type ProductRow,
} from "@/lib/cms/server/products/row.server";

import { persistProductsToFileSafe } from "@/lib/cms/server/products/writes.server";

export type ProductReadFields = "table" | "list" | "full";

export function stripHeavyFields(product: CmsProduct): CmsProduct {
  return {
    ...product,
    description: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
  };
}

export function stripTableFields(product: CmsProduct): CmsProduct {
  return {
    ...stripHeavyFields(product),
    shortDescription: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
    specs: [],
    documents: [],
    seo: {
      title: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
      description: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
    },
    // Keep colorVariants for SKU uniqueness helpers; trim names only via empty desc.
  };
}

export function projectFields(product: CmsProduct, fields: ProductReadFields): CmsProduct {
  if (fields === "table") return stripTableFields(product);
  if (fields === "list") return stripHeavyFields(product);
  return product;
}

export function selectColumns(fields: ProductReadFields): string {
  if (fields === "table") return PRODUCT_TABLE_COLUMNS;
  if (fields === "list") {
    return featuredColorColumnIsAvailable()
      ? PRODUCT_LIST_COLUMNS
      : PRODUCT_LIST_COLUMNS.split(",")
          .filter((column) => column !== FEATURED_COLOR_COLUMN)
          .join(",");
  }
  return "*";
}

export function productMatchesQuery(product: CmsProduct, q: string): boolean {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const name = [
    product.name.en,
    product.name["pt-BR"],
    product.name.es,
    product.name["zh-CN"],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return (
    product.id.toLowerCase().includes(needle) ||
    product.sku.toLowerCase().includes(needle) ||
    name.includes(needle)
  );
}

export function productMatchesTab(
  product: CmsProduct,
  tab: "active" | "archived" | "trash" | "all"
): boolean {
  if (tab === "all") return true;
  if (tab === "trash") return Boolean(product.deletedAt);
  if (product.deletedAt) return false;
  if (tab === "archived") return product.status === "archived";
  return product.status !== "archived";
}

export async function readProducts(options?: {
  includeDeleted?: boolean;
  /** Cookie-backed client for admin reads (drafts, trash). */
  asAdmin?: boolean;
  /**
   * `table` — admin product list (slim).
   * `list` — bulk / shop catalog without description HTML.
   * `full` — edit forms and public detail.
   */
  fields?: ProductReadFields;
  /** Skip trash purge (hot paths). */
  skipPurge?: boolean;
}) {
  const fields = options?.fields ?? "full";

  if (!options?.skipPurge) {
    try {
      await purgeExpiredProducts({ asAdmin: options?.asAdmin });
    } catch (error) {
      rethrowNextSignals(error);
      console.error(
        "cms_products purge:",
        error instanceof Error ? error.message : error
      );
    }
  }

  if (!isSupabaseConfigured()) {
    const local = getCmsProducts(options);
    return local.map((product) => projectFields(product, fields));
  }

  const fallback = () => {
    const local = getCmsProducts(options);
    return local.map((product) => projectFields(product, fields));
  };

  try {
    const supabase = options?.asAdmin
      ? await createClient()
      : createPublicClient({ tags: CATALOG_READ_TAGS });

    const runQuery = () => {
      let query = supabase
        .from("cms_products")
        .select(selectColumns(fields))
        .order("updated_at", { ascending: false });
      if (!options?.includeDeleted) {
        query = query.is("deleted_at", null);
      }
      return Promise.race([
        query,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Supabase products timeout")), 15000)
        ),
      ]);
    };

    let { data, error } = await runQuery();
    if (isMissingFeaturedColorColumn(error) && featuredColorColumnIsAvailable()) {
      disableFeaturedColorColumn();
      ({ data, error } = await runQuery());
    }
    if (error) throw new Error(error.message);

    const products = (data ?? [])
      .map((row) => {
        const product = rowToProduct(row as unknown as ProductRow);
        return projectFields(product, fields);
      })
      .filter((product) => !isProductPurgeDue(product));
    if (products.length === 0 && options?.asAdmin) {
      const seed = fallback();
      if (seed.length > 0) return seed;
    }
    return products;
  } catch (error) {
    rethrowNextSignals(error);
    console.error(
      "cms_products read:",
      error instanceof Error ? error.message : error
    );
    const seed = fallback();
    if (options?.asAdmin) return seed;
    return seed.filter(
      (product) => product.status === "published" && !product.deletedAt
    );
  }
}

/** Slim SKU index for duplicate / uniqueness checks — no images or HTML. */
export async function readProductSkuIndex(options?: {
  asAdmin?: boolean;
}): Promise<Array<{ id: string; sku: string; variantSkus: string[] }>> {
  const started = Date.now();

  const toIndex = (products: CmsProduct[]) =>
    products.map((product) => ({
      id: product.id,
      sku: product.sku,
      variantSkus: (product.colorVariants ?? [])
        .map((v) => v.sku?.trim() ?? "")
        .filter(Boolean),
    }));

  if (!isSupabaseConfigured()) {
    const local = getCmsProducts({ includeDeleted: true });
    const index = toIndex(local);
    logCmsPerf("readProductSkuIndex.local", started, { count: index.length });
    return index;
  }

  try {
    const supabase =
      options?.asAdmin !== false
        ? await createClient()
        : createPublicClient({ tags: CATALOG_READ_TAGS });
    const { data, error } = await supabase
      .from("cms_products")
      .select("id, sku, color_variants, deleted_at");
    if (error) throw new Error(error.message);

    const index = (data ?? []).map((row) => {
      const variants = Array.isArray(row.color_variants)
        ? (row.color_variants as Array<{ sku?: string }>)
        : [];
      return {
        id: String(row.id ?? ""),
        sku: String(row.sku ?? ""),
        variantSkus: variants
          .map((v) => (typeof v?.sku === "string" ? v.sku.trim() : ""))
          .filter(Boolean),
      };
    });
    logCmsPerf("readProductSkuIndex.supabase", started, { count: index.length });
    return index;
  } catch (error) {
    rethrowNextSignals(error);
    console.error(
      "cms_products sku index:",
      error instanceof Error ? error.message : error
    );
    const index = toIndex(getCmsProducts({ includeDeleted: true }));
    logCmsPerf("readProductSkuIndex.fallback", started, { count: index.length });
    return index;
  }
}


export async function purgeExpiredProducts(options?: {
  asAdmin?: boolean;
}): Promise<number> {
  const nowIso = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const removed = purgeExpiredCmsProducts();
    if (removed > 0) {
      await persistProductsToFileSafe(getCmsProducts({ includeDeleted: true }));
    }
    return removed;
  }

  if (!isServiceRoleConfigured() && !options?.asAdmin) {
    // Public catalog reads: skip DB delete; caller filters purge-due rows.
    return 0;
  }

  const client = isServiceRoleConfigured()
    ? createServiceClient()
    : await createClient();

  const { data, error } = await client
    .from("cms_products")
    .delete()
    .not("purge_at", "is", null)
    .lte("purge_at", nowIso)
    .select("id");

  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

