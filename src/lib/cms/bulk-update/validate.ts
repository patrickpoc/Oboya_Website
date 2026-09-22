import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import {
  applyPatchToProduct,
  formatFieldValue,
  getChangedFields,
} from "@/lib/cms/bulk-update/diff";
import { BULK_FIELD_LABELS } from "@/lib/cms/bulk-update/field-labels";
import type {
  BulkEditableField,
  BulkProductPatch,
  BulkUpdateCatalog,
  BulkValidationIssue,
  BulkWorkspaceRow,
} from "@/lib/cms/bulk-update/types";

function optionIdsForGroup(
  catalog: BulkUpdateCatalog,
  groupId: string
): Set<string> {
  return new Set((catalog.filterOptions[groupId] ?? []).map((opt) => opt.id));
}

function subcategoryBelongsToCategory(
  catalog: BulkUpdateCatalog,
  categoryId: string,
  subcategoryId: string
): boolean {
  if (!categoryId || !subcategoryId) return !subcategoryId;
  const category = catalog.categories.find((item) => item.id === categoryId);
  if (!category) return false;
  return category.subcategories.some((sub) => sub.id === subcategoryId);
}

function hasAnyName(product: CmsProduct): boolean {
  return Object.values(product.name ?? {}).some((value) => Boolean(value?.trim()));
}

function hasAnyMarket(product: CmsProduct): boolean {
  const map = product.enabledCountries ?? product.availability ?? {};
  return Object.values(map).some(Boolean);
}

function hasAnyPrice(product: CmsProduct): boolean {
  return Object.values(product.prices ?? {}).some((price) => Number(price) > 0);
}

function pushIssue(
  issues: BulkValidationIssue[],
  row: BulkWorkspaceRow,
  field: BulkEditableField | "product",
  status: BulkValidationIssue["status"],
  message: string,
  suggestedAction: string
) {
  issues.push({
    productId: row.productId,
    sku: row.pending.sku || row.original.sku,
    field,
    currentValue: field === "product" ? "" : formatFieldValue(field, row.original),
    requestedValue: field === "product" ? "" : formatFieldValue(field, row.pending),
    status,
    message,
    suggestedAction,
  });
}

function validateRow(
  row: BulkWorkspaceRow,
  catalog: BulkUpdateCatalog
): BulkValidationIssue[] {
  const issues: BulkValidationIssue[] = [];
  const product = row.pending;
  const changed = new Set(getChangedFields(row.original, row.pending));

  if (changed.has("moq") || product.moq !== undefined) {
    const moq = Number(product.moq);
    if (!Number.isFinite(moq) || moq < 1 || !Number.isInteger(moq)) {
      pushIssue(
        issues,
        row,
        "moq",
        "blocked",
        "MOQ must be an integer greater than or equal to 1.",
        "Enter a valid MOQ (e.g. 1, 10, 100)."
      );
    }
  }

  if (changed.has("categoryId") || changed.has("subcategoryId")) {
    if (product.categoryId) {
      const categoryExists = catalog.categories.some((c) => c.id === product.categoryId);
      if (!categoryExists) {
        pushIssue(
          issues,
          row,
          "categoryId",
          "blocked",
          `${BULK_FIELD_LABELS.categoryId} "${product.categoryId}" is not a valid category.`,
          "Select an existing category."
        );
      }
    }

    if (product.subcategoryId) {
      if (!product.categoryId) {
        pushIssue(
          issues,
          row,
          "subcategoryId",
          "blocked",
          "Subcategory requires a category.",
          "Select a category first, then a compatible subcategory."
        );
      } else if (
        !subcategoryBelongsToCategory(catalog, product.categoryId, product.subcategoryId)
      ) {
        pushIssue(
          issues,
          row,
          "subcategoryId",
          "blocked",
          `Subcategory "${product.subcategoryId}" is not compatible with Category "${product.categoryId}".`,
          "Select a compatible subcategory or change the category."
        );
      }
    }
  }

  if (changed.has("brandId") && product.brandId) {
    const brandExists = catalog.brands.some((brand) => brand.id === product.brandId);
    if (!brandExists) {
      pushIssue(
        issues,
        row,
        "brandId",
        "blocked",
        `Brand "${product.brandId}" is not a valid brand.`,
        "Select an existing brand."
      );
    }
  }

  const multiChecks: Array<{
    field: BulkEditableField;
    values: string[];
    groupId: string;
    label: string;
  }> = [
    {
      field: "application",
      values: product.application ?? [],
      groupId: "applications",
      label: BULK_FIELD_LABELS.application,
    },
    {
      field: "cultures",
      values: product.cultures ?? [],
      groupId: "cultures",
      label: BULK_FIELD_LABELS.cultures,
    },
    {
      field: "certifications",
      values: product.certifications ?? [],
      groupId: "certifications",
      label: BULK_FIELD_LABELS.certifications,
    },
  ];

  for (const check of multiChecks) {
    if (!changed.has(check.field)) continue;
    const allowed = optionIdsForGroup(catalog, check.groupId);
    const invalid = check.values.filter((id) => id && !allowed.has(id));
    if (invalid.length > 0) {
      pushIssue(
        issues,
        row,
        check.field,
        "blocked",
        `${check.label} contains invalid option(s): ${invalid.join(", ")}.`,
        `Select existing ${check.label.toLowerCase()} options from the catalog.`
      );
    }
  }

  if (changed.has("countryOfOrigin") && product.countryOfOrigin) {
    const allowed = optionIdsForGroup(catalog, "countriesOfOrigin");
    if (!allowed.has(product.countryOfOrigin)) {
      pushIssue(
        issues,
        row,
        "countryOfOrigin",
        "blocked",
        `Country of manufacture "${product.countryOfOrigin}" is not valid.`,
        "Select an existing country of manufacture option."
      );
    }
  }

  if (changed.has("enabledCountries")) {
    const map = product.enabledCountries ?? product.availability ?? {};
    const validCodes = new Set(catalog.countries.map((country) => country.code));
    const invalid = Object.keys(map).filter((code) => map[code] && !validCodes.has(code));
    if (invalid.length > 0) {
      pushIssue(
        issues,
        row,
        "enabledCountries",
        "blocked",
        `Market availability contains invalid country code(s): ${invalid.join(", ")}.`,
        "Use valid market country codes from the catalog (e.g. BR;US)."
      );
    }
  }

  if (changed.has("status") && product.status === "published") {
    if (!product.sku?.trim()) {
      pushIssue(
        issues,
        row,
        "status",
        "blocked",
        "Available in Shop requires a SKU.",
        "Set a SKU before enabling Shop availability."
      );
    }
    if (!hasAnyName(product)) {
      pushIssue(
        issues,
        row,
        "status",
        "blocked",
        "Available in Shop requires a product name in at least one language.",
        "Add a product name before enabling Shop availability."
      );
    }
    if (!product.categoryId || !product.subcategoryId || !product.brandId) {
      pushIssue(
        issues,
        row,
        "status",
        "blocked",
        "Available in Shop requires Category, Subcategory, and Brand.",
        "Fill Category, Subcategory, and Brand before enabling Shop."
      );
    } else if (
      !subcategoryBelongsToCategory(catalog, product.categoryId, product.subcategoryId)
    ) {
      pushIssue(
        issues,
        row,
        "status",
        "blocked",
        "Available in Shop requires a subcategory compatible with the selected category.",
        "Fix the category/subcategory pair before enabling Shop."
      );
    }

    if (!hasAnyMarket(product)) {
      pushIssue(
        issues,
        row,
        "enabledCountries",
        "warning",
        "No markets are enabled — the product will not appear for any country in the Shop.",
        "Enable at least one market, or leave Shop off until markets are configured."
      );
    }
    if (!hasAnyPrice(product)) {
      pushIssue(
        issues,
        row,
        "status",
        "warning",
        "No positive prices are set — the product may be hidden by Shop business rules.",
        "Add prices in the product editor if the product should be purchasable/quotable."
      );
    }
  }

  return issues;
}

export function validateBulkUpdate(
  rows: BulkWorkspaceRow[],
  catalog: BulkUpdateCatalog
): BulkValidationIssue[] {
  return rows.flatMap((row) => {
    if (getChangedFields(row.original, row.pending).length === 0) return [];
    return validateRow(row, catalog);
  });
}

export function summarizeValidation(issues: BulkValidationIssue[]) {
  const blockedCount = issues.filter((issue) => issue.status === "blocked").length;
  const warningCount = issues.filter((issue) => issue.status === "warning").length;
  const validFieldChangeCount = issues.filter((issue) => issue.status === "valid").length;
  return { blockedCount, warningCount, validFieldChangeCount };
}

export function issuesForProduct(
  issues: BulkValidationIssue[],
  productId: string,
  field?: BulkEditableField
): BulkValidationIssue[] {
  return issues.filter(
    (issue) =>
      issue.productId === productId &&
      (field === undefined || issue.field === field)
  );
}

export function buildRowsFromUpdates(
  productsById: Map<string, CmsProduct>,
  updates: Array<{ id: string; patch: BulkProductPatch }>
): BulkWorkspaceRow[] {
  const rows: BulkWorkspaceRow[] = [];
  for (const update of updates) {
    const original = productsById.get(update.id);
    if (!original) continue;
    const pending = applyPatchToProduct(original, update.patch);
    rows.push({
      productId: original.id,
      original,
      pending,
      changedFields: getChangedFields(original, pending),
    });
  }
  return rows;
}
