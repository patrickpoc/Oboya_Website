import "server-only";

import {
  getCmsProducts,
  isProductPurgeDue,
  type CmsProduct,
} from "@/lib/cms/repositories/product-repository";
import { rethrowNextSignals } from "@/lib/cms/server/rethrow-next-signals";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import { logCmsPerf } from "@/lib/cms/server/perf-log.server";
import { ALL_PRODUCTS_TAG, productTag } from "@/lib/cms/cache-tags";
import {
  CATALOG_READ_TAGS,
  disableMissingOptionalColumn,
  rowToProduct,
  type ProductRow,
} from "@/lib/cms/server/products/row.server";

import {
  productMatchesQuery,
  productMatchesTab,
  projectFields,
  readProducts,
  selectColumns,
  type ProductReadFields,
} from "@/lib/cms/server/products/reads.server";

export type ProductPageResult = {
  items: CmsProduct[];
  total: number;
  page: number;
  limit: number;
  tabCounts: { active: number; archived: number; trash: number };
  unitStats: { total: number; active: number; draft: number };
};

export function computeUnitStats(products: CmsProduct[]) {
  let total = 0;
  let active = 0;
  let draft = 0;
  for (const product of products) {
    if (product.deletedAt || product.status === "archived") continue;
    const units = 1 + (product.colorVariants?.length ?? 0);
    total += units;
    if (product.status === "published") active += units;
    else draft += units;
  }
  return { total, active, draft };
}

export function computeTabCounts(products: CmsProduct[]) {
  let active = 0;
  let archived = 0;
  let trash = 0;
  for (const product of products) {
    if (product.deletedAt) {
      trash += 1;
      continue;
    }
    if (product.status === "archived") archived += 1;
    else active += 1;
  }
  return { active, archived, trash };
}

export function applyTabFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  tab: "active" | "archived" | "trash" | "all"
) {
  if (tab === "trash") return query.not("deleted_at", "is", null);
  if (tab === "archived") {
    return query.is("deleted_at", null).eq("status", "archived");
  }
  if (tab === "active") {
    return query.is("deleted_at", null).neq("status", "archived");
  }
  return query;
}

export function applySearchFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  q: string
) {
  const needle = q.trim();
  if (!needle) return query;
  // Strip PostgREST reserved chars; wrap pattern in quotes for safety.
  const safe = needle.replace(/[%_,.()"'\\]/g, " ").replace(/\s+/g, " ").trim();
  if (!safe) return query;
  const pattern = `"%${safe}%"`;
  return query.or(
    [
      `sku.ilike.${pattern}`,
      `id.ilike.${pattern}`,
      `name->>en.ilike.${pattern}`,
      `name->>pt-BR.ilike.${pattern}`,
      `name->>es.ilike.${pattern}`,
      `name->>zh-CN.ilike.${pattern}`,
    ].join(",")
  );
}

/** Paginated admin product list with DB range + embedded tab/unit stats. */
export async function readProductsPage(options: {
  asAdmin?: boolean;
  fields?: ProductReadFields;
  page?: number;
  limit?: number;
  tab?: "active" | "archived" | "trash" | "all";
  q?: string;
}): Promise<ProductPageResult> {
  const started = Date.now();
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const tab = options.tab ?? "active";
  const fields = options.fields ?? "table";
  const q = options.q ?? "";

  if (!isSupabaseConfigured()) {
    const all = await readProducts({
      includeDeleted: true,
      asAdmin: options.asAdmin ?? true,
      fields,
      skipPurge: true,
    });
    const filtered = all.filter(
      (product) =>
        productMatchesTab(product, tab) && productMatchesQuery(product, q)
    );
    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);
    const result = {
      items,
      total,
      page,
      limit,
      tabCounts: computeTabCounts(all),
      unitStats: computeUnitStats(all),
    };
    logCmsPerf("readProductsPage.local", started, {
      tab,
      total,
      page,
      limit,
      q: Boolean(q.trim()),
    });
    return result;
  }

  try {
    const supabase = options.asAdmin !== false
      ? await createClient()
      : createPublicClient({ tags: CATALOG_READ_TAGS });

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let pageQuery = supabase
      .from("cms_products")
      .select(selectColumns(fields), { count: "exact" })
      .order("updated_at", { ascending: false });
    pageQuery = applyTabFilter(pageQuery, tab);
    pageQuery = applySearchFilter(pageQuery, q);
    pageQuery = pageQuery.range(from, to);

    const [pageResult, activeHead, archivedHead, trashHead, unitStatsRpc] =
      await Promise.all([
        Promise.race([
          pageQuery,
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Supabase products page timeout")),
              15000
            )
          ),
        ]),
        supabase
          .from("cms_products")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .neq("status", "archived"),
        supabase
          .from("cms_products")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("status", "archived"),
        supabase
          .from("cms_products")
          .select("id", { count: "exact", head: true })
          .not("deleted_at", "is", null),
        supabase.rpc("cms_product_unit_stats"),
      ]);

    if (disableMissingOptionalColumn(pageResult.error)) {
      return readProductsPage(options);
    }
    if (pageResult.error) throw new Error(pageResult.error.message);

    const items = (pageResult.data ?? [])
      .map((row) =>
        projectFields(rowToProduct(row as unknown as ProductRow), fields)
      )
      .filter((product) => !isProductPurgeDue(product));

    const rpcRow = Array.isArray(unitStatsRpc.data)
      ? (unitStatsRpc.data[0] as
          | { total?: number; active?: number; draft?: number }
          | undefined)
      : (unitStatsRpc.data as
          | { total?: number; active?: number; draft?: number }
          | null);

    let unitStats = { total: 0, active: 0, draft: 0 };
    if (!unitStatsRpc.error && rpcRow) {
      unitStats = {
        total: Number(rpcRow.total ?? 0),
        active: Number(rpcRow.active ?? 0),
        draft: Number(rpcRow.draft ?? 0),
      };
    } else {
      if (unitStatsRpc.error) {
        console.error(
          "cms_product_unit_stats:",
          unitStatsRpc.error.message ?? unitStatsRpc.error
        );
      }
      const { data: unitRows } = await supabase
        .from("cms_products")
        .select("id, status, deleted_at, color_variants")
        .is("deleted_at", null)
        .neq("status", "archived");
      unitStats = computeUnitStats(
        (unitRows ?? []).map((row) =>
          rowToProduct(row as unknown as ProductRow)
        )
      );
    }

    const result: ProductPageResult = {
      items,
      total: pageResult.count ?? items.length,
      page,
      limit,
      tabCounts: {
        active: activeHead.count ?? 0,
        archived: archivedHead.count ?? 0,
        trash: trashHead.count ?? 0,
      },
      unitStats,
    };

    logCmsPerf("readProductsPage.supabase", started, {
      tab,
      total: result.total,
      page,
      limit,
      items: items.length,
      q: Boolean(q.trim()),
    });
    return result;
  } catch (error) {
    rethrowNextSignals(error);
    console.error(
      "cms_products page:",
      error instanceof Error ? error.message : error
    );
    // Fallback: in-memory page from seed/cache.
    const all = getCmsProducts({ includeDeleted: true }).map((product) =>
      projectFields(product, fields)
    );
    const filtered = all.filter(
      (product) =>
        productMatchesTab(product, tab) && productMatchesQuery(product, q)
    );
    const start = (page - 1) * limit;
    const result = {
      items: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      limit,
      tabCounts: computeTabCounts(all),
      unitStats: computeUnitStats(all),
    };
    logCmsPerf("readProductsPage.fallback", started, {
      tab,
      total: result.total,
    });
    return result;
  }
}

/**
 * Permanently remove trash products whose `purge_at` is due.
 * Prefer the service-role client (cron); admin session can purge on trash load.
 */

export async function readProductById(
  id: string,
  options?: { asAdmin?: boolean }
): Promise<CmsProduct | undefined> {
  if (!id) return undefined;

  if (!isSupabaseConfigured()) {
    const products = getCmsProducts({ includeDeleted: true });
    return products.find(
      (product) => product.id === id || product.sku === id
    );
  }

  try {
    // Tagged by the requested key: writes bust both the product id and SKU.
    const supabase = options?.asAdmin
      ? await createClient()
      : createPublicClient({ tags: [productTag(id), ALL_PRODUCTS_TAG] });

    const byId = await Promise.race([
      supabase.from("cms_products").select("*").eq("id", id).maybeSingle(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase product timeout")), 8000)
      ),
    ]);

    if (byId.error) throw new Error(byId.error.message);
    if (byId.data) {
      const product = rowToProduct(byId.data as ProductRow);
      if (isProductPurgeDue(product)) return undefined;
      return product;
    }

    const bySku = await Promise.race([
      supabase.from("cms_products").select("*").eq("sku", id).maybeSingle(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase product timeout")), 8000)
      ),
    ]);

    if (bySku.error) throw new Error(bySku.error.message);
    if (!bySku.data) return undefined;
    const product = rowToProduct(bySku.data as ProductRow);
    if (isProductPurgeDue(product)) return undefined;
    return product;
  } catch (error) {
    rethrowNextSignals(error);
    console.error(
      "cms_products readById:",
      error instanceof Error ? error.message : error
    );
    const seed = getCmsProducts({ includeDeleted: true });
    return seed.find((product) => product.id === id || product.sku === id);
  }
}

/**
 * Strict lookup (includes trash) used before creating a product: saves are upserts
 * keyed by id, so an existing row with the same id or SKU would be overwritten.
 * Throws on read errors instead of falling back to seed data.
 */
export async function findExistingProduct(
  id: string,
  sku: string
): Promise<Pick<CmsProduct, "id" | "sku" | "name"> | null> {
  const keys = [...new Set([id, sku].map((k) => k?.trim()).filter(Boolean))];
  if (keys.length === 0) return null;

  if (!isSupabaseConfigured()) {
    const match = getCmsProducts({ includeDeleted: true }).find(
      (p) => keys.includes(p.id) || keys.includes(p.sku)
    );
    return match ? { id: match.id, sku: match.sku, name: match.name } : null;
  }

  const supabase = await createClient();
  for (const column of ["id", "sku"] as const) {
    const { data, error } = await supabase
      .from("cms_products")
      .select("id, sku, name")
      .in(column, keys)
      .limit(1);
    if (error) throw new Error(`Failed to check existing product: ${error.message}`);
    const row = data?.[0] as { id: string; sku: string; name: CmsProduct["name"] } | undefined;
    if (row) return { id: row.id, sku: row.sku, name: row.name };
  }
  return null;
}
