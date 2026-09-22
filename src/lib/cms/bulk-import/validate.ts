import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type {
  ImportCatalog,
  ImportEditableField,
  ImportValidationIssue,
  ImportWorkspaceRow,
} from "@/lib/cms/bulk-import/types";
import { IMPORT_FIELD_LABELS } from "@/lib/cms/bulk-import/types";

function hasAnyName(product: CmsProduct): boolean {
  return Object.values(product.name ?? {}).some((value) => Boolean(value?.trim()));
}

function hasAnyPrice(product: CmsProduct): boolean {
  return Object.values(product.prices ?? {}).some((price) => Number(price) > 0);
}

function hasAnyMarket(product: CmsProduct): boolean {
  const map = product.enabledCountries ?? product.availability ?? {};
  return Object.values(map).some(Boolean);
}

function subcategoryBelongsToCategory(
  catalog: ImportCatalog,
  categoryId: string,
  subcategoryId: string
): boolean {
  if (!categoryId || !subcategoryId) return !subcategoryId;
  const category = catalog.categories.find((item) => item.id === categoryId);
  if (!category) return false;
  return category.subcategories.some((sub) => sub.id === subcategoryId);
}

function pushIssue(
  issues: ImportValidationIssue[],
  row: ImportWorkspaceRow,
  field: ImportEditableField | "product" | "id",
  status: ImportValidationIssue["status"],
  message: string,
  suggestedAction: string
) {
  issues.push({
    productId: row.productId,
    sku: row.pending.sku || row.original.sku,
    field,
    currentValue: "",
    requestedValue: "",
    status,
    message,
    suggestedAction,
  });
}

function validateRow(
  row: ImportWorkspaceRow,
  catalog: ImportCatalog,
  batchSkus: Map<string, string[]>,
  batchIds: Map<string, string[]>
): ImportValidationIssue[] {
  const issues: ImportValidationIssue[] = [];
  const product = row.pending;

  if (!product.id?.trim()) {
    pushIssue(issues, row, "id", "blocked", "Product ID is required.", "Provide a unique id.");
  } else if (catalog.existingIds.has(product.id)) {
    pushIssue(
      issues,
      row,
      "id",
      "blocked",
      `ID "${product.id}" already exists.`,
      "Use a new unique id."
    );
  } else {
    const dupes = batchIds.get(product.id.toLowerCase()) ?? [];
    if (dupes.length > 1) {
      pushIssue(
        issues,
        row,
        "id",
        "blocked",
        `Duplicate ID "${product.id}" in this import batch.`,
        "Make each id unique in the spreadsheet."
      );
    }
  }

  if (!product.sku?.trim()) {
    pushIssue(issues, row, "sku", "blocked", "SKU is required.", "Fill the SKU field.");
  } else if (catalog.existingSkus.has(product.sku.toLowerCase())) {
    pushIssue(
      issues,
      row,
      "sku",
      "blocked",
      `SKU "${product.sku}" already exists.`,
      "Use a new unique SKU."
    );
  } else {
    const dupes = batchSkus.get(product.sku.toLowerCase()) ?? [];
    if (dupes.length > 1) {
      pushIssue(
        issues,
        row,
        "sku",
        "blocked",
        `Duplicate SKU "${product.sku}" in this import batch.`,
        "Make each SKU unique in the spreadsheet."
      );
    }
  }

  const moq = Number(product.moq);
  if (!Number.isFinite(moq) || moq < 1 || !Number.isInteger(moq)) {
    pushIssue(
      issues,
      row,
      "moq",
      "blocked",
      "MOQ must be an integer ≥ 1.",
      "Enter a valid MOQ."
    );
  }

  if (product.categoryId) {
    if (!catalog.categories.some((c) => c.id === product.categoryId)) {
      pushIssue(
        issues,
        row,
        "categoryId",
        "blocked",
        `${IMPORT_FIELD_LABELS.categoryId} is invalid.`,
        "Select an existing category."
      );
    }
  } else {
    pushIssue(
      issues,
      row,
      "categoryId",
      "blocked",
      "Category is required.",
      "Select a category."
    );
  }

  if (product.subcategoryId) {
    if (
      !subcategoryBelongsToCategory(catalog, product.categoryId, product.subcategoryId)
    ) {
      pushIssue(
        issues,
        row,
        "subcategoryId",
        "blocked",
        "Subcategory does not belong to the selected category.",
        "Pick a matching subcategory."
      );
    }
  }

  if (product.brandId) {
    if (!catalog.brands.some((b) => b.id === product.brandId)) {
      pushIssue(
        issues,
        row,
        "brandId",
        "blocked",
        `${IMPORT_FIELD_LABELS.brandId} is invalid.`,
        "Select an existing brand."
      );
    }
  } else {
    pushIssue(issues, row, "brandId", "blocked", "Brand is required.", "Select a brand.");
  }

  if (!hasAnyName(product)) {
    pushIssue(
      issues,
      row,
      "name",
      "blocked",
      "At least one product name locale is required.",
      "Fill name_en or name_ptBR."
    );
  }

  if (product.status === "published") {
    if (!hasAnyPrice(product)) {
      pushIssue(
        issues,
        row,
        "product",
        "warning",
        "Published product has no prices.",
        "Add at least one price or keep as draft."
      );
    }
    if (!hasAnyMarket(product)) {
      pushIssue(
        issues,
        row,
        "product",
        "warning",
        "Published product has no markets enabled.",
        "Enable markets after import or keep as draft."
      );
    }
  }

  return issues;
}

export function validateBulkImport(
  rows: ImportWorkspaceRow[],
  catalog: ImportCatalog
): ImportValidationIssue[] {
  const batchSkus = new Map<string, string[]>();
  const batchIds = new Map<string, string[]>();
  for (const row of rows) {
    const skuKey = row.pending.sku.trim().toLowerCase();
    const idKey = row.pending.id.trim().toLowerCase();
    if (skuKey) {
      const list = batchSkus.get(skuKey) ?? [];
      list.push(row.productId);
      batchSkus.set(skuKey, list);
    }
    if (idKey) {
      const list = batchIds.get(idKey) ?? [];
      list.push(row.productId);
      batchIds.set(idKey, list);
    }
  }

  return rows.flatMap((row) => validateRow(row, catalog, batchSkus, batchIds));
}

export function summarizeImportValidation(issues: ImportValidationIssue[]) {
  return {
    blockedCount: issues.filter((issue) => issue.status === "blocked").length,
    warningCount: issues.filter((issue) => issue.status === "warning").length,
  };
}

export function issuesForImportProduct(
  issues: ImportValidationIssue[],
  productId: string,
  field?: ImportEditableField | "product" | "id"
) {
  return issues.filter(
    (issue) =>
      issue.productId === productId && (field ? issue.field === field : true)
  );
}
