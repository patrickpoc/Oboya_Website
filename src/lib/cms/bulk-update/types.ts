import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { CmsStatus } from "@/lib/cms/types";
import type {
  ShopCategory,
  ShopCountry,
  ShopFilterOptions,
  SaleMode,
} from "@/lib/shop/types";

/** Max parent products / color groups in one bulk-update session (not each color row). */
export const BULK_UPDATE_MAX_PRODUCTS = 30;

export const BULK_PARENT_TAXONOMY_FIELDS = [
  "moq",
  "categoryId",
  "subcategoryId",
  "application",
  "cultures",
  "certifications",
  "countryOfOrigin",
  "enabledCountries",
  "status",
  "saleMode",
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
  "defaultColorNameEs",
  "defaultColorNameZh",
] as const;

export const BULK_VARIANT_FIELDS = [
  "variantSku",
  "variantColor",
  "variantNameEn",
  "variantNamePt",
  "variantNameEs",
  "variantNameZh",
  "variantImage",
  "variantSortOrder",
  "variantMoq",
  "variantPriceUsd",
  "variantPriceBrl",
  "variantPriceEur",
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
  /** Set for issues that belong to one color variant row; absent for parent/product issues. */
  variantId?: string | null;
  message: string;
  suggestedAction: string;
};

/** Patch applied on top of the original product (local pending state). */
export type BulkProductPatch = Partial<{
  moq: number;
  categoryId: string;
  subcategoryId: string;
  application: string[];
  cultures: string[];
  certifications: string[];
  countryOfOrigin: string;
  enabledCountries: Record<string, boolean>;
  status: CmsStatus;
  saleMode: SaleMode;
  priceUsd: number | null;
  priceBrl: number | null;
  priceEur: number | null;
  defaultColor: string;
  defaultColorNameEn: string;
  defaultColorNamePt: string;
  defaultColorNameEs: string;
  defaultColorNameZh: string;
  variantSku: string;
  variantColor: string;
  variantNameEn: string;
  variantNamePt: string;
  variantNameEs: string;
  variantNameZh: string;
  variantImage: string;
  variantSortOrder: number;
  variantMoq: number;
  variantPriceUsd: number | null;
  variantPriceBrl: number | null;
  variantPriceEur: number | null;
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
  countries: ShopCountry[];
  filterOptions: ShopFilterOptions;
  /**
   * Lowercased SKU -> id of the product that owns it (parent, legacy id or color SKU),
   * trashed products included. Lets validation reject SKUs owned by another product.
   */
  skuOwners?: Map<string, string>;
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
  /** Some or all of the change was held for manager approval. */
  pendingApproval?: boolean;
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
