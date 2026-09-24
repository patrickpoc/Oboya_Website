import type {
  CurrencyCode,
  ProductColorVariant,
  ShopLocalizedText,
  ShopProduct,
} from "@/lib/shop/types";

const FALLBACK_IMAGE = "/assets/homepage/greenhouse-technology.webp";

/** Synthetic id for the product’s standard/base color swatch (first in UI). */
export const DEFAULT_COLOR_VARIANT_ID = "__default__";

export function isDefaultColorVariantId(
  variantId?: string | null
): boolean {
  return !variantId || variantId === DEFAULT_COLOR_VARIANT_ID;
}

/** Cart / RFQ id: base color stores as null. */
export function toCartVariantId(variantId?: string | null): string | null {
  return isDefaultColorVariantId(variantId) ? null : variantId ?? null;
}

function emptyLocalizedText(): ShopLocalizedText {
  return { en: "", "pt-BR": "", es: "", "zh-CN": "" };
}

export function normalizeLocalizedColorName(
  value: unknown,
  fallbackName = ""
): ShopLocalizedText {
  const base = emptyLocalizedText();
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const row = value as Record<string, unknown>;
    for (const key of ["en", "pt-BR", "es", "zh-CN"] as const) {
      if (typeof row[key] === "string") base[key] = row[key];
    }
  }
  if (!base.en?.trim() && fallbackName) {
    base.en = fallbackName;
  }
  return base;
}

export function getVariantDisplayName(
  variant: Pick<ProductColorVariant, "name" | "nameI18n">,
  locale: string
): string {
  const i18n = variant.nameI18n;
  if (i18n) {
    const keyed = i18n[locale as keyof ShopLocalizedText];
    if (typeof keyed === "string" && keyed.trim()) return keyed.trim();
    if (i18n.en?.trim()) return i18n.en.trim();
  }
  return variant.name?.trim() || "";
}

export function normalizeColorVariants(
  value: unknown
): ProductColorVariant[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Partial<ProductColorVariant>;
      const id =
        typeof row.id === "string" && row.id && row.id !== DEFAULT_COLOR_VARIANT_ID
          ? row.id
          : `variant-${index}`;
      const name = typeof row.name === "string" ? row.name.trim() : "";
      const nameI18n = normalizeLocalizedColorName(row.nameI18n, name);
      if (name && !nameI18n.en) nameI18n.en = name;
      const sku = typeof row.sku === "string" ? row.sku.trim() : "";
      const moqRaw = Number(row.moq);
      const moq =
        Number.isFinite(moqRaw) && moqRaw >= 1 ? Math.floor(moqRaw) : 1;
      const color =
        typeof row.color === "string" && row.color ? row.color : "#888888";
      const image = typeof row.image === "string" ? row.image : "";
      const prices =
        row.prices && typeof row.prices === "object" && !Array.isArray(row.prices)
          ? (row.prices as ProductColorVariant["prices"])
          : {};
      const sortOrder =
        typeof row.sortOrder === "number" && Number.isFinite(row.sortOrder)
          ? row.sortOrder
          : index;
      return {
        id,
        name: name || nameI18n.en || "",
        nameI18n,
        sku,
        moq,
        color,
        image,
        prices,
        sortOrder,
      } satisfies ProductColorVariant;
    })
    .filter(Boolean)
    .sort((a, b) => a!.sortOrder - b!.sortOrder) as ProductColorVariant[];
}

export function hasColorVariants(
  product: Pick<ShopProduct, "colorVariants">
): boolean {
  return (product.colorVariants?.length ?? 0) > 0;
}

export function sortedColorVariants(
  product: Pick<ShopProduct, "colorVariants">
): ProductColorVariant[] {
  return [...(product.colorVariants ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
}

/** Base/default swatch from product standard color + primary image/prices. */
export function buildDefaultColorVariant(
  product: Pick<
    ShopProduct,
    "sku" | "moq" | "defaultColor" | "defaultColorName" | "images" | "prices"
  >
): ProductColorVariant {
  const nameI18n = normalizeLocalizedColorName(product.defaultColorName);
  const name = nameI18n.en?.trim() || "Default";
  const moq =
    Number.isFinite(Number(product.moq)) && Number(product.moq) >= 1
      ? Math.floor(Number(product.moq))
      : 1;
  return {
    id: DEFAULT_COLOR_VARIANT_ID,
    name,
    nameI18n,
    sku: product.sku || "",
    moq,
    color: product.defaultColor?.trim() || "#888888",
    image: product.images[0] || "",
    prices: {},
    sortOrder: -1,
  };
}

/**
 * Swatches for storefront: default product color first, then additional
 * variants. Empty when the product has no additional color options.
 */
export function getDisplayColorVariants(
  product: Pick<
    ShopProduct,
    | "sku"
    | "moq"
    | "colorVariants"
    | "defaultColor"
    | "defaultColorName"
    | "images"
    | "prices"
  >
): ProductColorVariant[] {
  if (!hasColorVariants(product)) return [];
  return [buildDefaultColorVariant(product), ...sortedColorVariants(product)];
}

export function getActiveVariant(
  product: Pick<
    ShopProduct,
    | "sku"
    | "moq"
    | "colorVariants"
    | "defaultColor"
    | "defaultColorName"
    | "images"
    | "prices"
  >,
  variantId?: string | null
): ProductColorVariant | null {
  const variants = getDisplayColorVariants(product);
  if (variants.length === 0) return null;
  const normalizedId = isDefaultColorVariantId(variantId)
    ? DEFAULT_COLOR_VARIANT_ID
    : variantId;
  const match = variants.find((variant) => variant.id === normalizedId);
  return match ?? variants[0] ?? null;
}

export function resolveVariantSku(
  product: Pick<ShopProduct, "sku">,
  variant: ProductColorVariant | null | undefined
): string {
  if (variant && !isDefaultColorVariantId(variant.id)) {
    const sku = variant.sku?.trim();
    if (sku) return sku;
  }
  return product.sku || "";
}

/** MOQ for the active color: variant.moq when set, otherwise product.moq (min 1). */
export function resolveVariantMoq(
  product: Pick<ShopProduct, "moq" | "colorVariants">,
  variant: ProductColorVariant | null | undefined
): number {
  const base =
    Number.isFinite(Number(product.moq)) && Number(product.moq) >= 1
      ? Math.floor(Number(product.moq))
      : 1;
  if (!variant || isDefaultColorVariantId(variant.id)) return base;
  const fromVariant = Number(variant.moq);
  if (Number.isFinite(fromVariant) && fromVariant >= 1) {
    return Math.floor(fromVariant);
  }
  return base;
}

/**
 * Sellable catalog units for the results count: always includes the main
 * (default) color, plus each additional color variant when present.
 */
export function countActiveSkus(
  products: Array<
    Pick<
      ShopProduct,
      | "sku"
      | "colorVariants"
      | "defaultColor"
      | "defaultColorName"
      | "images"
      | "prices"
    >
  >
): number {
  let total = 0;
  for (const product of products) {
    // Main / default color SKU
    total += 1;
    // Additional color variants (each is its own SKU)
    total += sortedColorVariants(product).length;
  }
  return total;
}

export function resolveVariantPrice(
  product: Pick<ShopProduct, "prices">,
  variant: ProductColorVariant | null | undefined,
  currency: CurrencyCode
): number {
  if (variant && !isDefaultColorVariantId(variant.id)) {
    const variantPrice = variant.prices[currency];
    if (typeof variantPrice === "number" && variantPrice > 0) {
      return variantPrice;
    }
  }
  return product.prices[currency] ?? 0;
}

/** Keep `imageColorIds` aligned with `images` length. */
export function normalizeImageColorIds(
  value: unknown,
  imageCount: number
): string[][] {
  const raw = Array.isArray(value) ? value : [];
  const result: string[][] = [];
  for (let i = 0; i < imageCount; i += 1) {
    const entry = raw[i];
    if (Array.isArray(entry)) {
      result.push(
        entry.filter((id): id is string => typeof id === "string" && id.length > 0)
      );
    } else {
      result.push([]);
    }
  }
  return result;
}

/**
 * Gallery URLs for a selected color.
 * Order: color’s primary image (variant / default) first, then product gallery
 * slots assigned to that color.
 *
 * Assignment rules when the product has color variants:
 * - Slot tagged with a color id → only that color
 * - Slot with empty tags → shared (all colors), only when no tags exist on any
 *   slot OR as filler for colors that have no explicit slots
 * - Never show another color’s tagged slot on a different color
 */
export function getGalleryImagesForVariant(
  product: Pick<
    ShopProduct,
    | "sku"
    | "moq"
    | "images"
    | "imageColorIds"
    | "colorVariants"
    | "defaultColor"
    | "defaultColorName"
    | "prices"
  >,
  variantId?: string | null
): string[] {
  const images = product.images ?? [];
  const colorIds = normalizeImageColorIds(
    product.imageColorIds,
    images.length
  );
  const filled = images
    .map((url, index) => ({
      url: url?.trim() ?? "",
      colorIds: colorIds[index] ?? [],
    }))
    .filter((entry) => entry.url);

  if (!hasColorVariants(product)) {
    return filled.map((entry) => entry.url);
  }

  const activeId = isDefaultColorVariantId(variantId)
    ? DEFAULT_COLOR_VARIANT_ID
    : variantId!;
  const activeVariant = getActiveVariant(product, activeId);
  const primary = activeVariant?.image?.trim() || "";

  const anyAssignments = filled.some((entry) => entry.colorIds.length > 0);
  const explicit = filled.filter((entry) =>
    entry.colorIds.includes(activeId)
  );
  const unassigned = filled.filter((entry) => entry.colorIds.length === 0);

  let secondary: string[];
  if (explicit.length > 0) {
    // Only slots tagged for this color.
    secondary = explicit.map((entry) => entry.url);
  } else if (!anyAssignments) {
    // Legacy: nothing tagged → entire gallery for every color.
    secondary = filled.map((entry) => entry.url);
  } else {
    // Other colors have tags; this color only gets shared (untagged) slots.
    // Do not leak slots tagged for a different color.
    secondary = unassigned.map((entry) => entry.url);
  }

  // Primary color image first; gallery slots follow (deduped).
  const seen = new Set<string>();
  const result: string[] = [];
  if (primary) {
    result.push(primary);
    seen.add(primary);
  }
  for (const url of secondary) {
    if (seen.has(url)) continue;
    seen.add(url);
    result.push(url);
  }
  if (result.length > 0) return result;
  return [FALLBACK_IMAGE];
}

export function resolveVariantImage(
  product: Pick<
    ShopProduct,
    | "sku"
    | "moq"
    | "images"
    | "imageColorIds"
    | "colorVariants"
    | "defaultColor"
    | "defaultColorName"
    | "prices"
  >,
  variant: ProductColorVariant | null | undefined
): string {
  const fromGallery = getGalleryImagesForVariant(product, variant?.id ?? null);
  return fromGallery[0] || FALLBACK_IMAGE;
}

/** Lowest positive price across base product + variants for catalog sort/filter. */
export function resolveCatalogPrice(
  product: Pick<ShopProduct, "prices" | "colorVariants">,
  currency: CurrencyCode
): number {
  const prices: number[] = [];
  const base = product.prices[currency];
  if (typeof base === "number" && base > 0) prices.push(base);
  for (const variant of product.colorVariants ?? []) {
    const value = resolveVariantPrice(product, variant, currency);
    if (value > 0) prices.push(value);
  }
  if (prices.length === 0) return 0;
  return Math.min(...prices);
}

export function createEmptyColorVariant(
  sortOrder = 0,
  currencies: CurrencyCode[] = [],
  sku = ""
): ProductColorVariant {
  const prices: ProductColorVariant["prices"] = {};
  for (const code of currencies) {
    prices[code] = 0;
  }
  const trimmedSku = sku.trim();
  return {
    id: trimmedSku || `color-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    nameI18n: emptyLocalizedText(),
    sku: trimmedSku,
    moq: 1,
    color: "#4DAF4E",
    image: "",
    prices,
    sortOrder,
  };
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function validateColorVariants(
  variants: ProductColorVariant[] | undefined | null,
  options?: {
    defaultColor?: string;
    defaultColorName?: ShopLocalizedText;
  }
): string | null {
  const list = variants ?? [];
  if (list.length === 0) return null;

  const defaultName =
    options?.defaultColorName?.en?.trim() ||
    options?.defaultColorName?.["pt-BR"]?.trim() ||
    "";
  if (!HEX_RE.test(options?.defaultColor || "")) {
    return "Set the product default color (hex) — it appears as the first swatch.";
  }
  if (!defaultName) {
    return "Set a name for the product default color (e.g. Black / Preto).";
  }

  const names = new Set<string>([defaultName.toLowerCase()]);
  const skus = new Set<string>();
  for (const variant of list) {
    const name =
      variant.nameI18n?.en?.trim() ||
      variant.name?.trim() ||
      "";
    if (!name) return "Each additional color needs a name (at least English).";
    const key = name.toLowerCase();
    if (names.has(key)) {
      return `Duplicate color name: ${name}`;
    }
    names.add(key);
    const sku = variant.sku?.trim() ?? "";
    if (!sku) {
      return `Color "${name}" needs its own SKU.`;
    }
    const skuKey = sku.toLowerCase();
    if (skus.has(skuKey)) {
      return `Duplicate color SKU: ${sku}`;
    }
    skus.add(skuKey);
    if (!HEX_RE.test(variant.color || "")) {
      return `Color for "${name}" must be a valid hex (e.g. #4DAF4E).`;
    }
    if (!variant.image?.trim()) {
      return `Color "${name}" needs an image.`;
    }
  }
  return null;
}
