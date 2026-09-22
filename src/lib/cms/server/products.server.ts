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
    moq: row.moq ?? 1,
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

export async function readProducts(options?: {
  includeDeleted?: boolean;
  /** Cookie-backed client for admin reads (drafts, trash). */
  asAdmin?: boolean;
}) {
  // Drop soft items whose 24h purge window has elapsed (Supabase + local).
  try {
    await purgeExpiredProducts();
  } catch (error) {
    rethrowNextSignals(error);
    console.error(
      "cms_products purge:",
      error instanceof Error ? error.message : error
    );
  }

  if (!isSupabaseConfigured()) {
    return getCmsProducts(options);
  }

  const fallback = () => getCmsProducts(options);

  try {
    const supabase = options?.asAdmin
      ? await createClient()
      : createPublicClient();

    let query = supabase
      .from("cms_products")
      .select("*")
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
      .map((row) => rowToProduct(row as ProductRow))
      // Defense in depth if DB purge could not run (RLS / missing service role).
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
) {
  const products = await readProducts({
    includeDeleted: true,
    asAdmin: options?.asAdmin,
  });
  return products.find((product) => product.id === id);
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

