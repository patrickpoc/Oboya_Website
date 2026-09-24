import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { CmsStatus } from "@/lib/cms/types";
import type {
  BulkApplyResult,
  BulkUpdateCatalog,
} from "@/lib/cms/bulk-update/types";

export const BULK_IMPORT_MAX_PRODUCTS = 30;

export const IMPORT_EDITABLE_FIELDS = [
  "sku",
  "name",
  "moq",
  "categoryId",
  "subcategoryId",
  "brandId",
  "priceUsd",
  "priceBrl",
  "priceEur",
  "stockQuantity",
  "unlimitedStock",
  "status",
] as const;

export type ImportEditableField = (typeof IMPORT_EDITABLE_FIELDS)[number];

export type ImportIssueStatus = "valid" | "warning" | "blocked";

export type ImportValidationIssue = {
  productId: string;
  sku: string;
  field: ImportEditableField | "product";
  currentValue: string;
  requestedValue: string;
  status: ImportIssueStatus;
  message: string;
  suggestedAction: string;
};

export type ImportProductPatch = Partial<{
  sku: string;
  nameEn: string;
  namePt: string;
  moq: number;
  categoryId: string;
  subcategoryId: string;
  brandId: string;
  priceUsd: number | null;
  priceBrl: number | null;
  priceEur: number | null;
  stockQuantity: number | null;
  unlimitedStock: boolean;
  status: CmsStatus;
}>;

export type ImportWorkspaceRow = {
  productId: string;
  original: CmsProduct;
  pending: CmsProduct;
  changedFields: ImportEditableField[];
};

export type ImportCatalog = BulkUpdateCatalog & {
  existingSkus: Set<string>;
  existingIds: Set<string>;
};

export type ImportApplyResult = BulkApplyResult;

export type ImportValidateRequest = {
  mode: "create";
  products: CmsProduct[];
};

export type SpreadsheetImportError = {
  row: number;
  sku: string;
  message: string;
  suggestedAction: string;
};

export const IMPORT_FIELD_LABELS: Record<ImportEditableField, string> = {
  sku: "SKU",
  name: "Product name",
  moq: "MOQ",
  categoryId: "Category",
  subcategoryId: "Subcategory",
  brandId: "Brand",
  priceUsd: "Price USD",
  priceBrl: "Price BRL",
  priceEur: "Price EUR",
  stockQuantity: "Stock quantity",
  unlimitedStock: "Unlimited stock",
  status: "Available in Shop",
};
