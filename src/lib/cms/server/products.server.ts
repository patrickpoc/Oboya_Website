import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  getCmsProducts,
  isProductPurgeDue,
  purgeExpiredCmsProducts,
  type CmsProduct,
} from "@/lib/cms/repositories/product-repository";
import { writeLocalJsonFile } from "@/lib/cms/server/local-fs.server";
import { rethrowNextSignals } from "@/lib/cms/server/rethrow-next-signals";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";
import { normalizeColorVariants, normalizeImageColorIds, normalizeLocalizedColorName } from "@/lib/shop/color-variants";
import { logCmsPerf } from "@/lib/cms/server/perf-log.server";

const PRODUCTS_FILE = path.join(process.cwd(), "data", "shop", "products.json");

type ProductRow = {
  id: string;
  sku: string;
  moq: number;
  brand_id: string;
  category_id: string;
  subcategory_id: string;
  images: unknown;
  image_color_ids?: unknown;
  tags: unknown;
  availability: unknown;
  enabled_countries: unknown;
  prices: unknown;
  application: unknown;
  cultures: unknown;
  certifications: unknown;
  country_of_origin: string;
  stock_status: CmsProduct["stockStatus"];
  stock_quantity: number | null;
  unlimited_stock: boolean;
  specs: unknown;
  documents: unknown;
  related_product_ids: unknown;
  default_color?: unknown;
  default_color_name?: unknown;
  color_variants: unknown;
  name: unknown;
  short_description: unknown;
  description: unknown;
  status: CmsProduct["status"];
  seo: unknown;
  deleted_at: string | null;
  purge_at: string | null;
};

function parseArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function parseObject<T extends object>(value: unknown, fallback: T): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }
  return fallback;
}

function rowToProduct(row: ProductRow): CmsProduct {
  return {
    id: row.id,
    sku: row.sku,
    moq:
      Number.isFinite(Number(row.moq)) && Number(row.moq) >= 1
        ? Math.floor(Number(row.moq))
        : 1,
    brandId: row.brand_id,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    images: (() => {
      const list = parseArray<string>(row.images);
      return list.length > 0 ? list : [""];
    })(),
    imageColorIds: normalizeImageColorIds(
      row.image_color_ids,
      (parseArray<string>(row.images).length || 1)
    ),
    tags: parseArray<string>(row.tags),
    availability: parseObject<Record<string, boolean>>(row.availability, {}),
    enabledCountries: parseObject<Record<string, boolean>>(row.enabled_countries, {}),
    prices: parseObject<CmsProduct["prices"]>(row.prices, {}),
    application: parseArray<string>(row.application),
    cultures: parseArray<string>(row.cultures),
    certifications: parseArray<string>(row.certifications),
    countryOfOrigin: row.country_of_origin ?? "",
    stockStatus: row.stock_status ?? "in_stock",
    stockQuantity: row.stock_quantity,
    unlimitedStock: row.unlimited_stock ?? true,
    specs: parseArray<CmsProduct["specs"][number]>(row.specs),
    documents: parseArray<CmsProduct["documents"][number]>(row.documents),
    relatedProductIds: parseArray<string>(row.related_product_ids),
    defaultColor: typeof row.default_color === "string" ? row.default_color : "",
    defaultColorName: normalizeLocalizedColorName(row.default_color_name),
    colorVariants: normalizeColorVariants(row.color_variants),
    name: parseObject<CmsProduct["name"]>(row.name, { en: "", "pt-BR": "", es: "", "zh-CN": "" }),
    shortDescription: parseObject<CmsProduct["shortDescription"]>(row.short_description, {
      en: "",
      "pt-BR": "",
      es: "",
      "zh-CN": "",
    }),
    description: parseObject<CmsProduct["description"]>(row.description, {
      en: "",
      "pt-BR": "",
      es: "",
      "zh-CN": "",
    }),
    status: row.status ?? "draft",
    seo: parseObject<CmsProduct["seo"]>(row.seo, {
      title: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
      description: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
    }),
    deletedAt: row.deleted_at,
    purgeAt: row.purge_at,
  };
}

function productToRow(product: CmsProduct): ProductRow {
  return {
    id: product.id,
    sku: product.sku,
    moq: product.moq ?? 1,
    brand_id: product.brandId,
    category_id: product.categoryId,
    subcategory_id: product.subcategoryId,
    images: product.images ?? [],
    image_color_ids: normalizeImageColorIds(
      product.imageColorIds,
      (product.images ?? []).length
    ),
    tags: product.tags ?? [],
    availability: product.availability ?? {},
    enabled_countries: product.enabledCountries ?? {},
    prices: product.prices ?? {},
    application: product.application ?? [],
    cultures: product.cultures ?? [],
    certifications: product.certifications ?? [],
    country_of_origin: product.countryOfOrigin ?? "",
    stock_status: product.stockStatus,
    stock_quantity: product.stockQuantity,
    unlimited_stock: product.unlimitedStock,
    specs: product.specs ?? [],
    documents: product.documents ?? [],
    related_product_ids: product.relatedProductIds ?? [],
    default_color: product.defaultColor ?? "",
    default_color_name: product.defaultColorName ?? {
      en: "",
      "pt-BR": "",
      es: "",
      "zh-CN": "",
    },
    color_variants: product.colorVariants ?? [],
    name: product.name,
    short_description: product.shortDescription,
    description: product.description,
    status: product.status,
    seo: product.seo,
    deleted_at: product.deletedAt ?? null,
    purge_at: product.purgeAt ?? null,
  };
}

/** Slim columns for admin products table UI. */
const PRODUCT_TABLE_COLUMNS = [
  "id",
  "sku",
  "moq",
  "brand_id",
  "category_id",
  "subcategory_id",
  "images",
  "prices",
  "name",
  "status",
  "stock_status",
  "stock_quantity",
  "unlimited_stock",
  "deleted_at",
  "purge_at",
  "updated_at",
  "color_variants",
].join(",");

/** Columns for bulk UIs — omits heavy HTML `description`. */
const PRODUCT_LIST_COLUMNS = [
  "id",
  "sku",
  "moq",
  "brand_id",
  "category_id",
  "subcategory_id",
  "images",
  "image_color_ids",
  "tags",
  "availability",
  "enabled_countries",
  "prices",
  "application",
  "cultures",
  "certifications",
  "country_of_origin",
  "stock_status",
  "stock_quantity",
  "unlimited_stock",
  "specs",
  "documents",
  "related_product_ids",
  "default_color",
  "default_color_name",
  "color_variants",
  "name",
  "short_description",
  "status",
  "seo",
  "deleted_at",
  "purge_at",
  "updated_at",
].join(",");

export type ProductReadFields = "table" | "list" | "full";

function stripHeavyFields(product: CmsProduct): CmsProduct {
  return {
    ...product,
    description: { en: "", "pt-BR": "", es: "", "zh-CN": "" },
  };
}

function stripTableFields(product: CmsProduct): CmsProduct {
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

function projectFields(product: CmsProduct, fields: ProductReadFields): CmsProduct {
  if (fields === "table") return stripTableFields(product);
  if (fields === "list") return stripHeavyFields(product);
  return product;
}

function selectColumns(fields: ProductReadFields): string {
  if (fields === "table") return PRODUCT_TABLE_COLUMNS;
  if (fields === "list") return PRODUCT_LIST_COLUMNS;
  return "*";
}

function productMatchesQuery(product: CmsProduct, q: string): boolean {
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

function productMatchesTab(
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
      : createPublicClient();

    let query = supabase
      .from("cms_products")
      .select(selectColumns(fields))
      .order("updated_at", { ascending: false });
    if (!options?.includeDeleted) {
      query = query.is("deleted_at", null);
    }

    const result = await Promise.race([
      query,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase products timeout")), 15000)
      ),
    ]);

    const { data, error } = result;
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
        : createPublicClient();
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

export type ProductPageResult = {
  items: CmsProduct[];
  total: number;
  page: number;
  limit: number;
  tabCounts: { active: number; archived: number; trash: number };
  unitStats: { total: number; active: number; draft: number };
};

function computeUnitStats(products: CmsProduct[]) {
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

function computeTabCounts(products: CmsProduct[]) {
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

function applyTabFilter(
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

function applySearchFilter(
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
      : createPublicClient();

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
    const supabase = options?.asAdmin
      ? await createClient()
      : createPublicClient();

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

export async function saveProduct(product: CmsProduct) {
  if (!isSupabaseConfigured()) {
    return product;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("cms_products").upsert(productToRow(product));
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

