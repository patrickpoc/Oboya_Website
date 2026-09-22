import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import {
  BULK_EDITABLE_FIELDS,
  type BulkEditableField,
  type BulkProductPatch,
  type BulkWorkspaceRow,
} from "@/lib/cms/bulk-update/types";

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

export function isBulkFieldEqual(
  field: BulkEditableField,
  original: CmsProduct,
  pending: CmsProduct
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
    default:
      return true;
  }
}

export function getChangedFields(original: CmsProduct, pending: CmsProduct): BulkEditableField[] {
  return BULK_EDITABLE_FIELDS.filter((field) => !isBulkFieldEqual(field, original, pending));
}

export function applyPatchToProduct(
  product: CmsProduct,
  patch: BulkProductPatch
): CmsProduct {
  const next: CmsProduct = { ...product };

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

  return next;
}

/** Build a patch containing only fields that differ from original. */
export function buildPatchFromPending(
  original: CmsProduct,
  pending: CmsProduct
): BulkProductPatch {
  const patch: BulkProductPatch = {};
  const changed = getChangedFields(original, pending);

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
  };
}

export function createWorkspaceRow(product: CmsProduct): BulkWorkspaceRow {
  const normalized = normalizeProductForBulk(product);
  const original = structuredClone(normalized);
  const pending = structuredClone(normalized);
  return {
    productId: normalized.id,
    original,
    pending,
    changedFields: [],
  };
}

export function refreshRowChangedFields(row: BulkWorkspaceRow): BulkWorkspaceRow {
  return {
    ...row,
    changedFields: getChangedFields(row.original, row.pending),
  };
}

export function formatFieldValue(
  field: BulkEditableField,
  product: CmsProduct
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
    default:
      return "";
  }
}
