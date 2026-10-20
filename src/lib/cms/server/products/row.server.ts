import "server-only";

import path from "node:path";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { normalizeColorVariants, normalizeImageColorIds, normalizeLocalizedColorName } from "@/lib/shop/color-variants";
import { ALL_PRODUCTS_TAG, CATALOG_TAG } from "@/lib/cms/cache-tags";
export const PRODUCTS_FILE = path.join(process.cwd(), "data", "shop", "products.json");

export const CATALOG_READ_TAGS = [CATALOG_TAG, ALL_PRODUCTS_TAG];

export type ProductRow = {
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
  featured_color_id?: unknown;
  color_variants: unknown;
  name: unknown;
  short_description: unknown;
  description: unknown;
  status: CmsProduct["status"];
  seo: unknown;
  deleted_at: string | null;
  purge_at: string | null;
};

export function parseArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function parseObject<T extends object>(value: unknown, fallback: T): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }
  return fallback;
}

export function rowToProduct(row: ProductRow): CmsProduct {
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
    featuredColorId:
      typeof row.featured_color_id === "string" ? row.featured_color_id : "",
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

/**
 * featured_color_id ships with migration 20261007_product_featured_color.sql.
 * Until it is applied, reads and writes retry without the column.
 */
let featuredColorColumnAvailable = true;

export function featuredColorColumnIsAvailable() {
  return featuredColorColumnAvailable;
}

export function disableFeaturedColorColumn() {
  featuredColorColumnAvailable = false;
}
export const FEATURED_COLOR_COLUMN = "featured_color_id";

export function isMissingFeaturedColorColumn(
  error: { code?: string; message?: string } | null | undefined
) {
  if (!error) return false;
  const missingColumn = error.code === "42703" || error.code === "PGRST204";
  return missingColumn && String(error.message ?? "").includes(FEATURED_COLOR_COLUMN);
}

export function productToRow(product: CmsProduct): ProductRow {
  const row = productToRowWithFeatured(product);
  if (!featuredColorColumnAvailable) delete row.featured_color_id;
  return row;
}

export function productToRowWithFeatured(product: CmsProduct): ProductRow {
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
    featured_color_id: product.featuredColorId ?? "",
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
export const PRODUCT_TABLE_COLUMNS = [
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
export const PRODUCT_LIST_COLUMNS = [
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
  FEATURED_COLOR_COLUMN,
  "color_variants",
  "name",
  "short_description",
  "status",
  "seo",
  "deleted_at",
  "purge_at",
  "updated_at",
].join(",");

