import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import {
  applyPatchToProduct,
  formatFieldValue,
  getChangedFields,
  productHasPendingChanges,
  createWorkspaceGroup,
} from "@/lib/cms/bulk-update/diff";
import { BULK_FIELD_LABELS } from "@/lib/cms/bulk-update/field-labels";
import type {
  BulkEditableField,
  BulkProductPatch,
  BulkUpdateCatalog,
  BulkValidationIssue,
  BulkWorkspaceRow,
} from "@/lib/cms/bulk-update/types";
import { validateColorVariants } from "@/lib/shop/color-variants";

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
  field: BulkEditableField | "product" | "colorVariants",
  status: BulkValidationIssue["status"],
  message: string,
  suggestedAction: string
) {
  issues.push({
    productId: row.productId,
    sku: row.matchedSku || row.pending.sku || row.original.sku,
    field,
    currentValue:
      field === "product" || field === "colorVariants"
        ? ""
        : formatFieldValue(field, row.original, row.variantId),
    requestedValue:
      field === "product" || field === "colorVariants"
        ? ""
        : formatFieldValue(field, row.pending, row.variantId),
    status,
    message,
    suggestedAction,
  });
}

function validateParentRow(
  row: BulkWorkspaceRow,
  catalog: BulkUpdateCatalog
): BulkValidationIssue[] {
  const issues: BulkValidationIssue[] = [];
  const product = row.pending;
  const changed = new Set(
    getChangedFields(row.original, row.pending, { kind: "parent" })
  );

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

  for (const priceField of ["priceUsd", "priceBrl", "priceEur"] as const) {
    if (!changed.has(priceField)) continue;
    const raw =
      priceField === "priceUsd"
        ? product.prices?.USD
        : priceField === "priceBrl"
          ? product.prices?.BRL
          : product.prices?.EUR;
    if (raw === undefined || raw === null) continue;
    if (!Number.isFinite(Number(raw)) || Number(raw) < 0) {
      pushIssue(
        issues,
        row,
        priceField,
        "blocked",
        `${BULK_FIELD_LABELS[priceField]} must be a non-negative number.`,
        "Enter a valid price or leave empty."
      );
    }
  }

  if (changed.has("defaultColor") && product.defaultColor) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(product.defaultColor)) {
      pushIssue(
        issues,
        row,
        "defaultColor",
        "blocked",
        "Default color must be a hex value (e.g. #4DAF4E).",
        "Use a 6-digit hex color."
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

function validateVariantRow(row: BulkWorkspaceRow): BulkValidationIssue[] {
  const issues: BulkValidationIssue[] = [];
  const changed = new Set(
    getChangedFields(row.original, row.pending, {
      kind: "variant",
      variantId: row.variantId,
    })
  );
  if (changed.size === 0) return issues;

  const variant = (row.pending.colorVariants ?? []).find(
    (item) => item.id === row.variantId
  );
  if (!variant) {
    pushIssue(
      issues,
      row,
      "product",
      "blocked",
      "Color variant is missing from the product.",
      "Remove this row and re-add the product group."
    );
    return issues;
  }

  if (changed.has("variantMoq")) {
    const moq = Number(variant.moq);
    if (!Number.isFinite(moq) || moq < 1 || !Number.isInteger(moq)) {
      pushIssue(
        issues,
        row,
        "variantMoq",
        "blocked",
        "Color MOQ must be an integer ≥ 1.",
        "Enter a valid MOQ for this color."
      );
    }
  }

  for (const priceField of [
    "variantPriceUsd",
    "variantPriceBrl",
    "variantPriceEur",
  ] as const) {
    if (!changed.has(priceField)) continue;
    const raw =
      priceField === "variantPriceUsd"
        ? variant.prices?.USD
        : priceField === "variantPriceBrl"
          ? variant.prices?.BRL
          : variant.prices?.EUR;
    if (raw === undefined || raw === null) continue;
    if (!Number.isFinite(Number(raw)) || Number(raw) < 0) {
      pushIssue(
        issues,
        row,
        priceField,
        "blocked",
        `${BULK_FIELD_LABELS[priceField]} must be a non-negative number.`,
        "Enter a valid price or leave empty (falls back to base price)."
      );
    }
  }

  return issues;
}

export function validateBulkUpdate(
  rows: BulkWorkspaceRow[],
  catalog: BulkUpdateCatalog
): BulkValidationIssue[] {
  const issues: BulkValidationIssue[] = [];
  const seenProducts = new Set<string>();

  for (const row of rows) {
    if (row.kind === "parent") {
      if (getChangedFields(row.original, row.pending, { kind: "parent" }).length > 0) {
        issues.push(...validateParentRow(row, catalog));
      }
    } else if (
      getChangedFields(row.original, row.pending, {
        kind: "variant",
        variantId: row.variantId,
      }).length > 0
    ) {
      issues.push(...validateVariantRow(row));
    }

    if (!seenProducts.has(row.productId) && productHasPendingChanges(row.original, row.pending)) {
      seenProducts.add(row.productId);
      const variantError = validateColorVariants(row.pending.colorVariants, {
        defaultColor: row.pending.defaultColor,
        defaultColorName: row.pending.defaultColorName,
      });
      if (variantError && (row.pending.colorVariants?.length ?? 0) > 0) {
        issues.push({
          productId: row.productId,
          sku: row.pending.sku || row.original.sku,
          field: "colorVariants",
          currentValue: "",
          requestedValue: "",
          status: "blocked",
          message: variantError,
          suggestedAction: "Fix color variant data before applying.",
        });
      }
    }
  }

  return issues;
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
    const group = createWorkspaceGroup(original).map((row) => ({
      ...row,
      pending,
      changedFields: getChangedFields(row.original, pending, {
        kind: row.kind,
        variantId: row.variantId,
      }),
    }));
    rows.push(...group);
  }
  return rows;
}
