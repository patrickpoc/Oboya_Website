import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { CmsStatus } from "@/lib/cms/types";
import type {
  ShopBrand,
  ShopCategory,
  ShopCountry,
  ShopFilterOptions,
} from "@/lib/shop/types";

export const BULK_EDITABLE_FIELDS = [
  "moq",
  "categoryId",
  "subcategoryId",
  "brandId",
  "application",
  "cultures",
  "certifications",
  "countryOfOrigin",
  "enabledCountries",
  "status",
] as const;

export type BulkEditableField = (typeof BULK_EDITABLE_FIELDS)[number];

export type BulkIssueStatus = "valid" | "warning" | "blocked";

export type BulkValidationIssue = {
  productId: string;
  sku: string;
  field: BulkEditableField | "product";
  currentValue: string;
  requestedValue: string;
  status: BulkIssueStatus;
  message: string;
  suggestedAction: string;
};

/** Patch applied on top of the original product (local pending state). */
export type BulkProductPatch = Partial<{
  moq: number;
  categoryId: string;
  subcategoryId: string;
  brandId: string;
  application: string[];
  cultures: string[];
  certifications: string[];
  countryOfOrigin: string;
  enabledCountries: Record<string, boolean>;
  status: CmsStatus;
}>;

export type BulkWorkspaceRow = {
  productId: string;
  original: CmsProduct;
  pending: CmsProduct;
  /** Fields that differ from original. */
  changedFields: BulkEditableField[];
};

export type BulkUpdateCatalog = {
  categories: ShopCategory[];
  brands: ShopBrand[];
  countries: ShopCountry[];
  filterOptions: ShopFilterOptions;
};

export type BulkApplyResultStatus = "SUCCESS" | "FAILED" | "SKIPPED";

export type BulkApplyResult = {
  productId: string;
  sku: string;
  name: string;
  status: BulkApplyResultStatus;
  error?: string;
  field?: BulkEditableField | "product";
  currentValue?: string;
  requestedValue?: string;
  suggestedAction?: string;
};

export type BulkValidateRequest = {
  updates: Array<{ id: string; patch: BulkProductPatch }>;
};

export type BulkValidateResponse = {
  issues: BulkValidationIssue[];
  blockedCount: number;
  warningCount: number;
  validFieldChangeCount: number;
};
