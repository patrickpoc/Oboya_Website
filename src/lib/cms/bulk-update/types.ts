import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { CmsStatus } from "@/lib/cms/types";
import type {
  ShopBrand,
  ShopCategory,
  ShopCountry,
  ShopFilterOptions,
} from "@/lib/shop/types";

/** Max parent products / color groups in one bulk-update session (not each color row). */
export const BULK_UPDATE_MAX_PRODUCTS = 100;

export const BULK_PARENT_TAXONOMY_FIELDS = [
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

export const BULK_PARENT_PRICE_FIELDS = [
  "priceUsd",
  "priceBrl",
  "priceEur",
] as const;

export const BULK_PARENT_COLOR_FIELDS = [
  "defaultColor",
  "defaultColorNameEn",
  "defaultColorNamePt",
] as const;

export const BULK_VARIANT_FIELDS = [
  "variantSku",
  "variantColor",
  "variantColorNameEn",
  "variantColorNamePt",
  "variantPriceUsd",
  "variantPriceBrl",
  "variantPriceEur",
  "variantImage",
] as const;

export const BULK_EDITABLE_FIELDS = [
  ...BULK_PARENT_TAXONOMY_FIELDS,
  ...BULK_PARENT_PRICE_FIELDS,
  ...BULK_PARENT_COLOR_FIELDS,
  ...BULK_VARIANT_FIELDS,
] as const;

export type BulkEditableField = (typeof BULK_EDITABLE_FIELDS)[number];

export type BulkSkuRowKind = "parent" | "variant";

export type BulkIssueStatus = "valid" | "warning" | "blocked";

export type BulkValidationIssue = {
  productId: string;
  sku: string;
  field: BulkEditableField | "product" | "colorVariants";
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
  priceUsd: number | null;
  priceBrl: number | null;
  priceEur: number | null;
  defaultColor: string;
  defaultColorNameEn: string;
  defaultColorNamePt: string;
  variantSku: string;
  variantColor: string;
  variantColorNameEn: string;
  variantColorNamePt: string;
  variantPriceUsd: number | null;
  variantPriceBrl: number | null;
  variantPriceEur: number | null;
  variantImage: string;
}>;

export type BulkWorkspaceRow = {
  /** Stable UI key: `${productId}` or `${productId}::${variantId}`. */
  rowId: string;
  kind: BulkSkuRowKind;
  /** Always the parent CMS document id. */
  productId: string;
  matchedSku: string;
  /** null = base / parent SKU. */
  variantId: string | null;
  original: CmsProduct;
  /** Shared pending product document across the parent+children group. */
  pending: CmsProduct;
  /** Fields that differ from original (scoped to this row's editable columns). */
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
  field?: BulkEditableField | "product" | "colorVariants";
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
