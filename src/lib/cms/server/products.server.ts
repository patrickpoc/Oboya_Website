import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCmsProducts, type CmsProduct } from "@/lib/cms/repositories/product-repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const PRODUCTS_FILE = path.join(process.cwd(), "data", "shop", "products.json");

type ProductRow = {
  id: string;
  sku: string;
  moq: number;
  brand_id: string;
  category_id: string;
  subcategory_id: string;
  images: unknown;
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
    images: parseArray<string>(row.images),
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
    name: product.name,
    short_description: product.shortDescription,
    description: product.description,
    status: product.status,
    seo: product.seo,
    deleted_at: product.deletedAt ?? null,
    purge_at: product.purgeAt ?? null,
  };
}

export async function readProducts(options?: { includeDeleted?: boolean }) {
  if (!isSupabaseConfigured()) {
    return getCmsProducts(options);
  }

  const supabase = await createClient();
  let query = supabase.from("cms_products").select("*").order("updated_at", { ascending: false });
  if (!options?.includeDeleted) {
    query = query.is("deleted_at", null);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Failed to read products: ${error.message}`);
  return (data ?? []).map((row) => rowToProduct(row as ProductRow));
}

export async function readProductById(id: string) {
  const products = await readProducts({ includeDeleted: true });
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
  await writeFile(PRODUCTS_FILE, `${JSON.stringify(products, null, 2)}\n`, "utf-8");
}

export async function readProductsFromFile() {
  const raw = await readFile(PRODUCTS_FILE, "utf-8");
  return JSON.parse(raw) as CmsProduct[];
}

