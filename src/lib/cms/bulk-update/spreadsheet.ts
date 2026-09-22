import * as XLSX from "xlsx";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { CmsStatus } from "@/lib/cms/types";
import { applyPatchToProduct, createWorkspaceRow, refreshRowChangedFields } from "@/lib/cms/bulk-update/diff";
import {
  BULK_SPREADSHEET_HEADERS,
  SPREADSHEET_HEADER_ALIASES,
  type BulkSpreadsheetHeader,
} from "@/lib/cms/bulk-update/field-labels";
import type {
  BulkProductPatch,
  BulkUpdateCatalog,
  BulkWorkspaceRow,
} from "@/lib/cms/bulk-update/types";

export type SpreadsheetImportError = {
  row: number;
  sku: string;
  message: string;
  suggestedAction: string;
};

export type SpreadsheetImportResult = {
  rows: BulkWorkspaceRow[];
  errors: SpreadsheetImportError[];
  skippedEmpty: number;
};

function normalizeHeader(raw: string): BulkSpreadsheetHeader | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if ((BULK_SPREADSHEET_HEADERS as readonly string[]).includes(raw.trim())) {
    return raw.trim() as BulkSpreadsheetHeader;
  }
  const compact = key.replace(/[\s_/]+/g, "");
  return (
    SPREADSHEET_HEADER_ALIASES[key] ??
    SPREADSHEET_HEADER_ALIASES[compact] ??
    null
  );
}

function splitMulti(value: string): string[] {
  return value
    .split(/[|;]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function resolveOptionId(
  raw: string,
  catalog: BulkUpdateCatalog,
  groupId: string
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const options = catalog.filterOptions[groupId] ?? [];
  const byId = options.find((opt) => opt.id === trimmed);
  if (byId) return byId.id;
  const lower = trimmed.toLowerCase();
  const byName = options.find(
    (opt) =>
      opt.name.toLowerCase() === lower ||
      Object.values(opt.nameI18n ?? {}).some(
        (label) => label?.toLowerCase() === lower
      )
  );
  return byName?.id ?? null;
}

function resolveCategoryId(raw: string, catalog: BulkUpdateCatalog): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const byId = catalog.categories.find((c) => c.id === trimmed);
  if (byId) return byId.id;
  const lower = trimmed.toLowerCase();
  return (
    catalog.categories.find((c) => c.name.toLowerCase() === lower)?.id ?? null
  );
}

function resolveSubcategoryId(
  raw: string,
  catalog: BulkUpdateCatalog,
  categoryId?: string
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const categories = categoryId
    ? catalog.categories.filter((c) => c.id === categoryId)
    : catalog.categories;
  for (const category of categories) {
    const byId = category.subcategories.find((s) => s.id === trimmed);
    if (byId) return byId.id;
  }
  const lower = trimmed.toLowerCase();
  for (const category of categories) {
    const byName = category.subcategories.find((s) => s.name.toLowerCase() === lower);
    if (byName) return byName.id;
  }
  return null;
}

function resolveBrandId(raw: string, catalog: BulkUpdateCatalog): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const byId = catalog.brands.find((b) => b.id === trimmed);
  if (byId) return byId.id;
  const lower = trimmed.toLowerCase();
  return catalog.brands.find((b) => b.name.toLowerCase() === lower)?.id ?? null;
}

function parseShopStatus(raw: string): CmsStatus | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  if (["yes", "true", "1", "published", "on"].includes(value)) return "published";
  if (["no", "false", "0", "draft", "off"].includes(value)) return "draft";
  return null;
}

function parseRowToPatch(
  cells: Partial<Record<BulkSpreadsheetHeader, string>>,
  catalog: BulkUpdateCatalog,
  current: CmsProduct,
  rowNumber: number,
  errors: SpreadsheetImportError[]
): BulkProductPatch {
  const patch: BulkProductPatch = {};
  const sku = current.sku;

  const moqRaw = cells["MOQ"]?.trim();
  if (moqRaw) {
    const moq = Number(moqRaw);
    if (!Number.isFinite(moq) || moq < 1 || !Number.isInteger(moq)) {
      errors.push({
        row: rowNumber,
        sku,
        message: `Invalid MOQ "${moqRaw}".`,
        suggestedAction: "Use an integer ≥ 1.",
      });
    } else {
      patch.moq = moq;
    }
  }

  const categoryRaw = cells["Category"]?.trim();
  let nextCategoryId = current.categoryId;
  if (categoryRaw) {
    const resolved = resolveCategoryId(categoryRaw, catalog);
    if (!resolved) {
      errors.push({
        row: rowNumber,
        sku,
        message: `Unknown category "${categoryRaw}".`,
        suggestedAction: "Use an existing category id or name.",
      });
    } else {
      patch.categoryId = resolved;
      nextCategoryId = resolved;
    }
  }

  const subcategoryRaw = cells["Subcategory"]?.trim();
  if (subcategoryRaw) {
    const resolved = resolveSubcategoryId(subcategoryRaw, catalog, nextCategoryId);
    if (!resolved) {
      errors.push({
        row: rowNumber,
        sku,
        message: `Unknown subcategory "${subcategoryRaw}".`,
        suggestedAction: "Use an existing subcategory compatible with the category.",
      });
    } else {
      patch.subcategoryId = resolved;
    }
  }

  const brandRaw = cells["Brand"]?.trim();
  if (brandRaw) {
    const resolved = resolveBrandId(brandRaw, catalog);
    if (!resolved) {
      errors.push({
        row: rowNumber,
        sku,
        message: `Unknown brand "${brandRaw}".`,
        suggestedAction: "Use an existing brand id or name.",
      });
    } else {
      patch.brandId = resolved;
    }
  }

  const multiMaps: Array<{
    header: BulkSpreadsheetHeader;
    groupId: string;
    key: keyof BulkProductPatch;
  }> = [
    { header: "Application", groupId: "applications", key: "application" },
    { header: "Crop/Culture", groupId: "cultures", key: "cultures" },
    { header: "Certifications", groupId: "certifications", key: "certifications" },
  ];

  for (const map of multiMaps) {
    const raw = cells[map.header]?.trim();
    if (!raw) continue;
    const parts = splitMulti(raw);
    const resolved: string[] = [];
    let failed = false;
    for (const part of parts) {
      const id = resolveOptionId(part, catalog, map.groupId);
      if (!id) {
        errors.push({
          row: rowNumber,
          sku,
          message: `Unknown ${map.header} value "${part}".`,
          suggestedAction: `Use a valid ${map.header} option id or label.`,
        });
        failed = true;
        break;
      }
      resolved.push(id);
    }
    if (!failed) {
      (patch as Record<string, unknown>)[map.key] = resolved;
    }
  }

  const countryRaw = cells["Country of manufacture"]?.trim();
  if (countryRaw) {
    const resolved = resolveOptionId(countryRaw, catalog, "countriesOfOrigin");
    if (!resolved) {
      errors.push({
        row: rowNumber,
        sku,
        message: `Unknown country of manufacture "${countryRaw}".`,
        suggestedAction: "Use a valid country of manufacture option.",
      });
    } else {
      patch.countryOfOrigin = resolved;
    }
  }

  const marketsRaw = cells["Market availability"]?.trim();
  if (marketsRaw) {
    const codes = splitMulti(marketsRaw).map((code) => code.toUpperCase());
    const validCodes = new Set(catalog.countries.map((c) => c.code));
    const invalid = codes.filter((code) => !validCodes.has(code));
    if (invalid.length > 0) {
      errors.push({
        row: rowNumber,
        sku,
        message: `Invalid market code(s): ${invalid.join(", ")}.`,
        suggestedAction: "Use valid country codes (e.g. BR;US).",
      });
    } else {
      const enabled: Record<string, boolean> = {};
      for (const country of catalog.countries) {
        enabled[country.code] = codes.includes(country.code);
      }
      patch.enabledCountries = enabled;
    }
  }

  const shopRaw = cells["Available in Shop"]?.trim();
  if (shopRaw) {
    const status = parseShopStatus(shopRaw);
    if (!status) {
      errors.push({
        row: rowNumber,
        sku,
        message: `Invalid Available in Shop value "${shopRaw}".`,
        suggestedAction: "Use yes/no, true/false, or published/draft.",
      });
    } else {
      patch.status = status;
    }
  }

  return patch;
}

function recordsFromSheet(data: unknown[][]): {
  headers: BulkSpreadsheetHeader[];
  rows: Array<Partial<Record<BulkSpreadsheetHeader, string>>>;
  headerErrors: string[];
} {
  const headerErrors: string[] = [];
  if (data.length < 1) {
    return { headers: [], rows: [], headerErrors: ["Spreadsheet is empty."] };
  }

  const rawHeaders = (data[0] ?? []).map((cell) => String(cell ?? "").trim());
  const headers: BulkSpreadsheetHeader[] = [];
  const headerIndex: Partial<Record<BulkSpreadsheetHeader, number>> = {};

  rawHeaders.forEach((raw, index) => {
    if (!raw) return;
    const normalized = normalizeHeader(raw);
    if (!normalized) {
      headerErrors.push(`Unknown column "${raw}".`);
      return;
    }
    headers.push(normalized);
    headerIndex[normalized] = index;
  });

  if (!("SKU" in headerIndex)) {
    headerErrors.push('Missing required column "SKU".');
  }

  const rows = data.slice(1).map((line) => {
    const entry: Partial<Record<BulkSpreadsheetHeader, string>> = {};
    for (const header of BULK_SPREADSHEET_HEADERS) {
      const index = headerIndex[header];
      if (index === undefined) continue;
      const value = line[index];
      entry[header] = value === undefined || value === null ? "" : String(value).trim();
    }
    return entry;
  });

  return { headers, rows, headerErrors };
}

export function parseSpreadsheetBuffer(
  buffer: ArrayBuffer,
  fileName: string
): { records: Array<Partial<Record<BulkSpreadsheetHeader, string>>>; errors: string[] } {
  const lower = fileName.toLowerCase();
  let workbook: XLSX.WorkBook;

  if (lower.endsWith(".csv")) {
    const text = new TextDecoder("utf-8").decode(buffer);
    workbook = XLSX.read(text, { type: "string" });
  } else {
    workbook = XLSX.read(buffer, { type: "array" });
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { records: [], errors: ["Spreadsheet has no sheets."] };
  }
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  const { rows, headerErrors } = recordsFromSheet(data);
  return { records: rows, errors: headerErrors };
}

/**
 * Merge spreadsheet rows into workspace.
 * Empty cells keep current values. Unknown SKUs become errors.
 */
export function mergeSpreadsheetIntoWorkspace(params: {
  records: Array<Partial<Record<BulkSpreadsheetHeader, string>>>;
  productsBySku: Map<string, CmsProduct>;
  existingRows: BulkWorkspaceRow[];
  catalog: BulkUpdateCatalog;
}): SpreadsheetImportResult {
  const { records, productsBySku, existingRows, catalog } = params;
  const errors: SpreadsheetImportError[] = [];
  const byId = new Map(existingRows.map((row) => [row.productId, { ...row }]));
  let skippedEmpty = 0;
  const seenSkus = new Set<string>();

  records.forEach((cells, index) => {
    const rowNumber = index + 2;
    const sku = (cells.SKU ?? "").trim();
    if (!sku) {
      const hasAnyValue = Object.entries(cells).some(
        ([key, value]) => key !== "SKU" && Boolean(value?.trim())
      );
      if (hasAnyValue) {
        errors.push({
          row: rowNumber,
          sku: "",
          message: "SKU is required.",
          suggestedAction: "Provide a SKU for every data row.",
        });
      } else {
        skippedEmpty += 1;
      }
      return;
    }

    const skuKey = sku.toLowerCase();
    if (seenSkus.has(skuKey)) {
      errors.push({
        row: rowNumber,
        sku,
        message: `Duplicate SKU "${sku}" in spreadsheet.`,
        suggestedAction: "Keep only one row per SKU.",
      });
      return;
    }
    seenSkus.add(skuKey);

    const product = productsBySku.get(skuKey);
    if (!product) {
      errors.push({
        row: rowNumber,
        sku,
        message: `No product found for SKU "${sku}".`,
        suggestedAction: "Use an existing product SKU.",
      });
      return;
    }

    const existing = byId.get(product.id);
    const baseOriginal = existing?.original ?? structuredClone(product);
    const basePending = existing?.pending ?? structuredClone(product);
    const patch = parseRowToPatch(cells, catalog, basePending, rowNumber, errors);

    if (Object.keys(patch).length === 0) {
      if (!existing) {
        byId.set(product.id, createWorkspaceRow(product));
      }
      return;
    }

    const pending = applyPatchToProduct(basePending, patch);
    byId.set(
      product.id,
      refreshRowChangedFields({
        productId: product.id,
        original: baseOriginal,
        pending,
        changedFields: [],
      })
    );
  });

  return {
    rows: Array.from(byId.values()),
    errors,
    skippedEmpty,
  };
}

export function buildTemplateWorkbook(): ArrayBuffer {
  const example = [
    ...BULK_SPREADSHEET_HEADERS,
  ];
  const sample = [
    "SKU-001",
    "100",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "BR;US",
    "yes",
  ];
  const notes = [
    [
      "NOTES",
      "SKU is required. Empty cells keep the current product value (they do NOT clear fields).",
      "Use existing category/brand/option ids or exact labels.",
      "Multi-value columns: separate with ; or |",
      "Market availability: country codes like BR;US",
      "Available in Shop: yes/no or published/draft",
    ],
  ];

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([example, sample, [], ...notes]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Bulk Update");
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}

export function downloadBulkUpdateTemplate() {
  const buffer = buildTemplateWorkbook();
  const blob = new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "oboya-bulk-update-template.xlsx";
  anchor.click();
  URL.revokeObjectURL(url);
}
