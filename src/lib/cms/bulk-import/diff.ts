import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { CmsStatus } from "@/lib/cms/types";
import { createEmptyImportProduct } from "@/lib/cms/bulk-import/empty-product";
import type {
  ImportEditableField,
  ImportProductPatch,
  ImportWorkspaceRow,
} from "@/lib/cms/bulk-import/types";
import { IMPORT_EDITABLE_FIELDS } from "@/lib/cms/bulk-import/types";

function nameFingerprint(product: CmsProduct): string {
  return ["en", "pt-BR", "es", "zh-CN"]
    .map((locale) => product.name?.[locale as keyof typeof product.name] ?? "")
    .join("|");
}

export function getImportChangedFields(
  original: CmsProduct,
  pending: CmsProduct
): ImportEditableField[] {
  const changed: ImportEditableField[] = [];
  for (const field of IMPORT_EDITABLE_FIELDS) {
    switch (field) {
      case "sku":
        if ((original.sku ?? "") !== (pending.sku ?? "")) changed.push(field);
        break;
      case "name":
        if (nameFingerprint(original) !== nameFingerprint(pending)) changed.push(field);
        break;
      case "moq":
        if (Number(original.moq ?? 0) !== Number(pending.moq ?? 0)) changed.push(field);
        break;
      case "categoryId":
        if ((original.categoryId ?? "") !== (pending.categoryId ?? "")) changed.push(field);
        break;
      case "subcategoryId":
        if ((original.subcategoryId ?? "") !== (pending.subcategoryId ?? "")) changed.push(field);
        break;
      case "brandId":
        if ((original.brandId ?? "") !== (pending.brandId ?? "")) changed.push(field);
        break;
      case "priceUsd":
        if (Number(original.prices?.USD ?? 0) !== Number(pending.prices?.USD ?? 0)) {
          changed.push(field);
        }
        break;
      case "priceBrl":
        if (Number(original.prices?.BRL ?? 0) !== Number(pending.prices?.BRL ?? 0)) {
          changed.push(field);
        }
        break;
      case "priceEur":
        if (Number(original.prices?.EUR ?? 0) !== Number(pending.prices?.EUR ?? 0)) {
          changed.push(field);
        }
        break;
      case "stockQuantity":
        if (Number(original.stockQuantity ?? 0) !== Number(pending.stockQuantity ?? 0)) {
          changed.push(field);
        }
        break;
      case "unlimitedStock":
        if (Boolean(original.unlimitedStock) !== Boolean(pending.unlimitedStock)) {
          changed.push(field);
        }
        break;
      case "status":
        if ((original.status ?? "draft") !== (pending.status ?? "draft")) changed.push(field);
        break;
      default:
        break;
    }
  }
  return changed;
}

export function createImportWorkspaceRow(product: CmsProduct): ImportWorkspaceRow {
  const baseline = createEmptyImportProduct({
    id: product.id,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
    brandId: product.brandId,
  });
  const original: CmsProduct = {
    ...baseline,
    id: product.id,
    enabledCountries: product.enabledCountries ?? baseline.enabledCountries,
    availability: product.availability ?? baseline.availability,
  };
  return {
    productId: product.id,
    original,
    pending: product,
    changedFields: getImportChangedFields(original, product),
  };
}

export function refreshImportChangedFields(row: ImportWorkspaceRow): ImportWorkspaceRow {
  return {
    ...row,
    changedFields: getImportChangedFields(row.original, row.pending),
  };
}

export function applyImportPatch(
  product: CmsProduct,
  patch: ImportProductPatch
): CmsProduct {
  const next: CmsProduct = {
    ...product,
    name: { ...product.name },
    prices: { ...product.prices },
  };

  if (patch.id !== undefined) next.id = patch.id;
  if (patch.sku !== undefined) next.sku = patch.sku;
  if (patch.nameEn !== undefined) next.name = { ...next.name, en: patch.nameEn };
  if (patch.namePt !== undefined) next.name = { ...next.name, "pt-BR": patch.namePt };
  if (patch.moq !== undefined) next.moq = patch.moq;
  if (patch.categoryId !== undefined) next.categoryId = patch.categoryId;
  if (patch.subcategoryId !== undefined) next.subcategoryId = patch.subcategoryId;
  if (patch.brandId !== undefined) next.brandId = patch.brandId;
  if (patch.priceUsd !== undefined) {
    next.prices = { ...next.prices, USD: patch.priceUsd ?? 0 };
  }
  if (patch.priceBrl !== undefined) {
    next.prices = { ...next.prices, BRL: patch.priceBrl ?? 0 };
  }
  if (patch.priceEur !== undefined) {
    next.prices = { ...next.prices, EUR: patch.priceEur ?? 0 };
  }
  if (patch.stockQuantity !== undefined) next.stockQuantity = patch.stockQuantity;
  if (patch.unlimitedStock !== undefined) next.unlimitedStock = patch.unlimitedStock;
  if (patch.status !== undefined) next.status = patch.status as CmsStatus;

  return next;
}
