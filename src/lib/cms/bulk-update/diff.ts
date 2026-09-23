import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { expandSkuGroup } from "@/lib/cms/admin-sku-lookup";
import {
  BULK_PARENT_COLOR_FIELDS,
  BULK_PARENT_PRICE_FIELDS,
  BULK_PARENT_TAXONOMY_FIELDS,
  BULK_VARIANT_FIELDS,
  type BulkEditableField,
  type BulkProductPatch,
  type BulkSkuRowKind,
  type BulkWorkspaceRow,
} from "@/lib/cms/bulk-update/types";
import type { ProductColorVariant } from "@/lib/shop/types";
import { normalizeLocalizedColorName } from "@/lib/shop/color-variants";

function sameStringArray(a: string[] | undefined, b: string[] | undefined): boolean {
  const left = [...(a ?? [])].map(String).sort();
  const right = [...(b ?? [])].map(String).sort();
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function sameCountryMap(
  a: Record<string, boolean> | undefined,
  b: Record<string, boolean> | undefined
): boolean {
  const left = a ?? {};
  const right = b ?? {};
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    if (Boolean(left[key]) !== Boolean(right[key])) return false;
  }
  return true;
}

function priceValue(
  prices: CmsProduct["prices"] | ProductColorVariant["prices"] | undefined,
  code: "USD" | "BRL" | "EUR"
): number {
  const value = prices?.[code];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function findVariant(
  product: CmsProduct,
  variantId: string | null | undefined
): ProductColorVariant | null {
  if (!variantId) return null;
  return (product.colorVariants ?? []).find((variant) => variant.id === variantId) ?? null;
}

export function workspaceRowId(
  productId: string,
  variantId: string | null
): string {
  return variantId ? `${productId}::${variantId}` : productId;
}

export function isBulkFieldEqual(
  field: BulkEditableField,
  original: CmsProduct,
  pending: CmsProduct,
  variantId?: string | null
): boolean {
  switch (field) {
    case "moq":
      return Number(original.moq) === Number(pending.moq);
    case "categoryId":
      return original.categoryId === pending.categoryId;
    case "subcategoryId":
      return original.subcategoryId === pending.subcategoryId;
    case "brandId":
      return original.brandId === pending.brandId;
    case "application":
      return sameStringArray(original.application, pending.application);
    case "cultures":
      return sameStringArray(original.cultures, pending.cultures);
    case "certifications":
      return sameStringArray(original.certifications, pending.certifications);
    case "countryOfOrigin":
      return (original.countryOfOrigin || "") === (pending.countryOfOrigin || "");
    case "enabledCountries":
      return sameCountryMap(
        original.enabledCountries ?? original.availability,
        pending.enabledCountries ?? pending.availability
      );
    case "status":
      return original.status === pending.status;
    case "priceUsd":
      return priceValue(original.prices, "USD") === priceValue(pending.prices, "USD");
    case "priceBrl":
      return priceValue(original.prices, "BRL") === priceValue(pending.prices, "BRL");
    case "priceEur":
      return priceValue(original.prices, "EUR") === priceValue(pending.prices, "EUR");
    case "defaultColor":
      return (original.defaultColor || "") === (pending.defaultColor || "");
    case "defaultColorNameEn":
      return (
        (original.defaultColorName?.en || "") === (pending.defaultColorName?.en || "")
      );
    case "defaultColorNamePt":
      return (
        (original.defaultColorName?.["pt-BR"] || "") ===
        (pending.defaultColorName?.["pt-BR"] || "")
      );
    case "variantSku":
    case "variantColor":
    case "variantColorNameEn":
    case "variantColorNamePt":
    case "variantPriceUsd":
    case "variantPriceBrl":
    case "variantPriceEur":
    case "variantImage": {
      const before = findVariant(original, variantId);
      const after = findVariant(pending, variantId);
      if (!before && !after) return true;
      if (!before || !after) return false;
      switch (field) {
        case "variantSku":
          return (before.sku || "") === (after.sku || "");
        case "variantColor":
          return (before.color || "") === (after.color || "");
        case "variantColorNameEn":
          return (
            (before.nameI18n?.en || before.name || "") ===
            (after.nameI18n?.en || after.name || "")
          );
        case "variantColorNamePt":
          return (
            (before.nameI18n?.["pt-BR"] || "") === (after.nameI18n?.["pt-BR"] || "")
          );
        case "variantPriceUsd":
          return priceValue(before.prices, "USD") === priceValue(after.prices, "USD");
        case "variantPriceBrl":
          return priceValue(before.prices, "BRL") === priceValue(after.prices, "BRL");
        case "variantPriceEur":
          return priceValue(before.prices, "EUR") === priceValue(after.prices, "EUR");
        case "variantImage":
          return (before.image || "") === (after.image || "");
        default:
          return true;
      }
    }
    default:
      return true;
  }
}

function fieldsForKind(kind: BulkSkuRowKind): readonly BulkEditableField[] {
  if (kind === "parent") {
    return [
      ...BULK_PARENT_TAXONOMY_FIELDS,
      ...BULK_PARENT_PRICE_FIELDS,
      ...BULK_PARENT_COLOR_FIELDS,
    ];
  }
  return [...BULK_VARIANT_FIELDS];
}

export function getChangedFields(
  original: CmsProduct,
  pending: CmsProduct,
  options?: { kind?: BulkSkuRowKind; variantId?: string | null }
): BulkEditableField[] {
  const kind = options?.kind ?? "parent";
  const variantId = options?.variantId ?? null;
  return fieldsForKind(kind).filter(
    (field) => !isBulkFieldEqual(field, original, pending, variantId)
  );
}

/** True when the shared pending document differs from original in any persistable way. */
export function productHasPendingChanges(
  original: CmsProduct,
  pending: CmsProduct
): boolean {
  if (getChangedFields(original, pending, { kind: "parent" }).length > 0) {
    return true;
  }
  const originalVariants = original.colorVariants ?? [];
  const pendingVariants = pending.colorVariants ?? [];
  if (originalVariants.length !== pendingVariants.length) return true;
  for (const variant of pendingVariants) {
    if (
      getChangedFields(original, pending, {
        kind: "variant",
        variantId: variant.id,
      }).length > 0
    ) {
      return true;
    }
  }
  return JSON.stringify(originalVariants) !== JSON.stringify(pendingVariants);
}

function setCurrencyPrice(
  prices: CmsProduct["prices"],
  code: "USD" | "BRL" | "EUR",
  value: number | null | undefined
): CmsProduct["prices"] {
  const next = { ...prices };
  if (value === null || value === undefined) {
    delete next[code];
  } else {
    next[code] = value;
  }
  return next;
}

function applyVariantPatch(
  variant: ProductColorVariant,
  patch: BulkProductPatch
): ProductColorVariant {
  const next: ProductColorVariant = {
    ...variant,
    nameI18n: normalizeLocalizedColorName(variant.nameI18n, variant.name),
    prices: { ...variant.prices },
  };

  if (patch.variantSku !== undefined) {
    const sku = patch.variantSku.trim();
    next.sku = sku;
    if (sku) next.id = sku;
  }
  if (patch.variantColor !== undefined) next.color = patch.variantColor;
  if (patch.variantColorNameEn !== undefined) {
    next.nameI18n = { ...next.nameI18n, en: patch.variantColorNameEn };
    next.name = patch.variantColorNameEn || next.name;
  }
  if (patch.variantColorNamePt !== undefined) {
    next.nameI18n = { ...next.nameI18n, "pt-BR": patch.variantColorNamePt };
  }
  if (patch.variantPriceUsd !== undefined) {
    next.prices = setCurrencyPrice(next.prices, "USD", patch.variantPriceUsd);
  }
  if (patch.variantPriceBrl !== undefined) {
    next.prices = setCurrencyPrice(next.prices, "BRL", patch.variantPriceBrl);
  }
  if (patch.variantPriceEur !== undefined) {
    next.prices = setCurrencyPrice(next.prices, "EUR", patch.variantPriceEur);
  }
  if (patch.variantImage !== undefined) next.image = patch.variantImage;

  return next;
}

export function applyPatchToProduct(
  product: CmsProduct,
  patch: BulkProductPatch,
  variantId?: string | null
): CmsProduct {
  const next: CmsProduct = {
    ...product,
    prices: { ...product.prices },
    defaultColorName: normalizeLocalizedColorName(product.defaultColorName),
    colorVariants: [...(product.colorVariants ?? [])],
  };

  if (patch.moq !== undefined) next.moq = patch.moq;
  if (patch.categoryId !== undefined) next.categoryId = patch.categoryId;
  if (patch.subcategoryId !== undefined) next.subcategoryId = patch.subcategoryId;
  if (patch.brandId !== undefined) next.brandId = patch.brandId;
  if (patch.application !== undefined) next.application = [...patch.application];
  if (patch.cultures !== undefined) next.cultures = [...patch.cultures];
  if (patch.certifications !== undefined) next.certifications = [...patch.certifications];
  if (patch.countryOfOrigin !== undefined) next.countryOfOrigin = patch.countryOfOrigin;
  if (patch.enabledCountries !== undefined) {
    next.enabledCountries = { ...patch.enabledCountries };
    next.availability = { ...patch.enabledCountries };
  }
  if (patch.status !== undefined) next.status = patch.status;
  if (patch.priceUsd !== undefined) {
    next.prices = setCurrencyPrice(next.prices, "USD", patch.priceUsd);
  }
  if (patch.priceBrl !== undefined) {
    next.prices = setCurrencyPrice(next.prices, "BRL", patch.priceBrl);
  }
  if (patch.priceEur !== undefined) {
    next.prices = setCurrencyPrice(next.prices, "EUR", patch.priceEur);
  }
  if (patch.defaultColor !== undefined) next.defaultColor = patch.defaultColor;
  if (patch.defaultColorNameEn !== undefined) {
    next.defaultColorName = {
      ...next.defaultColorName,
      en: patch.defaultColorNameEn,
    };
  }
  if (patch.defaultColorNamePt !== undefined) {
    next.defaultColorName = {
      ...next.defaultColorName,
      "pt-BR": patch.defaultColorNamePt,
    };
  }

  const hasVariantPatch = BULK_VARIANT_FIELDS.some(
    (field) => patch[field] !== undefined
  );
  if (hasVariantPatch && variantId) {
    next.colorVariants = next.colorVariants.map((variant) =>
      variant.id === variantId ? applyVariantPatch(variant, patch) : variant
    );
  }

  return next;
}

/** Build a patch containing only parent taxonomy/price fields that differ from original. */
export function buildPatchFromPending(
  original: CmsProduct,
  pending: CmsProduct
): BulkProductPatch {
  const patch: BulkProductPatch = {};
  const changed = getChangedFields(original, pending, { kind: "parent" });

  for (const field of changed) {
    switch (field) {
      case "moq":
        patch.moq = pending.moq;
        break;
      case "categoryId":
        patch.categoryId = pending.categoryId;
        break;
      case "subcategoryId":
        patch.subcategoryId = pending.subcategoryId;
        break;
      case "brandId":
        patch.brandId = pending.brandId;
        break;
      case "application":
        patch.application = [...pending.application];
        break;
      case "cultures":
        patch.cultures = [...pending.cultures];
        break;
      case "certifications":
        patch.certifications = [...pending.certifications];
        break;
      case "countryOfOrigin":
        patch.countryOfOrigin = pending.countryOfOrigin;
        break;
      case "enabledCountries":
        patch.enabledCountries = {
          ...(pending.enabledCountries ?? pending.availability),
        };
        break;
      case "status":
        patch.status = pending.status;
        break;
      case "priceUsd":
        patch.priceUsd = pending.prices?.USD ?? null;
        break;
      case "priceBrl":
        patch.priceBrl = pending.prices?.BRL ?? null;
        break;
      case "priceEur":
        patch.priceEur = pending.prices?.EUR ?? null;
        break;
      case "defaultColor":
        patch.defaultColor = pending.defaultColor ?? "";
        break;
      case "defaultColorNameEn":
        patch.defaultColorNameEn = pending.defaultColorName?.en ?? "";
        break;
      case "defaultColorNamePt":
        patch.defaultColorNamePt = pending.defaultColorName?.["pt-BR"] ?? "";
        break;
      default:
        break;
    }
  }

  return patch;
}

export function normalizeProductForBulk(product: CmsProduct): CmsProduct {
  const enabledCountries = {
    ...(product.enabledCountries ?? product.availability ?? {}),
  };
  return {
    ...product,
    moq: Number.isFinite(Number(product.moq)) && Number(product.moq) >= 1
      ? Math.floor(Number(product.moq))
      : 1,
    categoryId: product.categoryId ?? "",
    subcategoryId: product.subcategoryId ?? "",
    brandId: product.brandId ?? "",
    application: Array.isArray(product.application) ? [...product.application] : [],
    cultures: Array.isArray(product.cultures) ? [...product.cultures] : [],
    certifications: Array.isArray(product.certifications)
      ? [...product.certifications]
      : [],
    countryOfOrigin: product.countryOfOrigin ?? "",
    enabledCountries,
    availability: { ...enabledCountries },
    status: product.status ?? "draft",
    prices: { ...(product.prices ?? {}) },
    defaultColor: product.defaultColor ?? "",
    defaultColorName: normalizeLocalizedColorName(product.defaultColorName),
    colorVariants: structuredClone(product.colorVariants ?? []),
  };
}

function toWorkspaceRow(
  product: CmsProduct,
  original: CmsProduct,
  pending: CmsProduct,
  kind: BulkSkuRowKind,
  matchedSku: string,
  variantId: string | null
): BulkWorkspaceRow {
  return {
    rowId: workspaceRowId(product.id, variantId),
    kind,
    productId: product.id,
    matchedSku,
    variantId,
    original,
    pending,
    changedFields: getChangedFields(original, pending, { kind, variantId }),
  };
}

/** Expand a product into parent + color child workspace rows sharing one pending. */
export function createWorkspaceGroup(product: CmsProduct): BulkWorkspaceRow[] {
  const normalized = normalizeProductForBulk(product);
  const original = structuredClone(normalized);
  const pending = structuredClone(normalized);
  return expandSkuGroup(normalized).map((entry) =>
    toWorkspaceRow(
      normalized,
      original,
      pending,
      entry.kind,
      entry.matchedSku,
      entry.variantId
    )
  );
}

/** @deprecated Prefer createWorkspaceGroup — kept for tests expecting a single parent row. */
export function createWorkspaceRow(product: CmsProduct): BulkWorkspaceRow {
  const group = createWorkspaceGroup(product);
  return group[0]!;
}

/** Refresh changedFields and keep shared pending/original clones consistent per productId. */
export function refreshRowChangedFields(row: BulkWorkspaceRow): BulkWorkspaceRow {
  return {
    ...row,
    changedFields: getChangedFields(row.original, row.pending, {
      kind: row.kind,
      variantId: row.variantId,
    }),
  };
}

/** After mutating pending for one product, sync every row in that group. */
export function syncGroupPending(
  rows: BulkWorkspaceRow[],
  productId: string,
  pending: CmsProduct
): BulkWorkspaceRow[] {
  return rows.map((row) => {
    if (row.productId !== productId) return row;
    const matchedSku =
      row.kind === "parent"
        ? pending.sku?.trim() || row.matchedSku
        : findVariant(pending, row.variantId)?.sku?.trim() || row.matchedSku;
    return refreshRowChangedFields({
      ...row,
      pending,
      matchedSku,
      // Variant id may change when SKU is edited to become the new id.
      variantId:
        row.kind === "variant" && row.variantId
          ? findVariant(pending, row.variantId)?.id ??
            pending.colorVariants?.find(
              (variant) => variant.sku?.toLowerCase() === matchedSku.toLowerCase()
            )?.id ??
            row.variantId
          : row.variantId,
      rowId: workspaceRowId(
        productId,
        row.kind === "variant"
          ? findVariant(pending, row.variantId)?.id ?? row.variantId
          : null
      ),
    });
  });
}

export function replaceOrInsertGroup(
  existingRows: BulkWorkspaceRow[],
  product: CmsProduct
): BulkWorkspaceRow[] {
  const without = existingRows.filter((row) => row.productId !== product.id);
  return [...without, ...createWorkspaceGroup(product)];
}

export function formatFieldValue(
  field: BulkEditableField,
  product: CmsProduct,
  variantId?: string | null
): string {
  switch (field) {
    case "moq":
      return String(product.moq ?? "");
    case "categoryId":
      return product.categoryId || "";
    case "subcategoryId":
      return product.subcategoryId || "";
    case "brandId":
      return product.brandId || "";
    case "application":
      return (product.application ?? []).join("; ");
    case "cultures":
      return (product.cultures ?? []).join("; ");
    case "certifications":
      return (product.certifications ?? []).join("; ");
    case "countryOfOrigin":
      return product.countryOfOrigin || "";
    case "enabledCountries": {
      const map = product.enabledCountries ?? product.availability ?? {};
      return Object.entries(map)
        .filter(([, enabled]) => enabled)
        .map(([code]) => code)
        .sort()
        .join("; ");
    }
    case "status":
      return product.status === "published" ? "yes" : "no";
    case "priceUsd":
      return String(priceValue(product.prices, "USD") || "");
    case "priceBrl":
      return String(priceValue(product.prices, "BRL") || "");
    case "priceEur":
      return String(priceValue(product.prices, "EUR") || "");
    case "defaultColor":
      return product.defaultColor || "";
    case "defaultColorNameEn":
      return product.defaultColorName?.en || "";
    case "defaultColorNamePt":
      return product.defaultColorName?.["pt-BR"] || "";
    case "variantSku":
    case "variantColor":
    case "variantColorNameEn":
    case "variantColorNamePt":
    case "variantPriceUsd":
    case "variantPriceBrl":
    case "variantPriceEur":
    case "variantImage": {
      const variant = findVariant(product, variantId);
      if (!variant) return "";
      switch (field) {
        case "variantSku":
          return variant.sku || "";
        case "variantColor":
          return variant.color || "";
        case "variantColorNameEn":
          return variant.nameI18n?.en || variant.name || "";
        case "variantColorNamePt":
          return variant.nameI18n?.["pt-BR"] || "";
        case "variantPriceUsd":
          return String(priceValue(variant.prices, "USD") || "");
        case "variantPriceBrl":
          return String(priceValue(variant.prices, "BRL") || "");
        case "variantPriceEur":
          return String(priceValue(variant.prices, "EUR") || "");
        case "variantImage":
          return variant.image || "";
        default:
          return "";
      }
    }
    default:
      return "";
  }
}
