import * as XLSX from "xlsx";
import { createEmptyImportProduct } from "@/lib/cms/bulk-import/empty-product";
import { createImportWorkspaceRow } from "@/lib/cms/bulk-import/diff";
import {
  BULK_IMPORT_MAX_PRODUCTS,
  type ImportCatalog,
  type ImportWorkspaceRow,
  type SpreadsheetImportError,
} from "@/lib/cms/bulk-import/types";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { CmsStatus } from "@/lib/cms/types";
import { parsePriceInput } from "@/lib/cms/parse-price";

export const IMPORT_SPREADSHEET_HEADERS = [
  "sku",
  "name_en",
  "name_ptBR",
  "name_es",
  "name_zhCN",
  "categoryId",
  "subcategoryId",
  "brandId",
  "moq",
  "price_usd",
  "price_brl",
  "price_eur",
  "stock_quantity",
  "unlimited_stock",
  "status",
  "main_image",
  "image_2",
  "image_3",
  "short_en",
  "short_ptBR",
  "desc_en",
  "desc_ptBR",
] as const;

export type ImportSpreadsheetHeader = (typeof IMPORT_SPREADSHEET_HEADERS)[number];

const HEADER_ALIASES: Record<string, ImportSpreadsheetHeader> = {
  sku: "sku",
  name_en: "name_en",
  nameen: "name_en",
  "name en": "name_en",
  name_ptbr: "name_ptBR",
  name_pt: "name_ptBR",
  nameptbr: "name_ptBR",
  name_es: "name_es",
  namees: "name_es",
  name_zhcn: "name_zhCN",
  name_zh: "name_zhCN",
  categoryid: "categoryId",
  category: "categoryId",
  subcategoryid: "subcategoryId",
  subcategory: "subcategoryId",
  brandid: "brandId",
  brand: "brandId",
  moq: "moq",
  price_usd: "price_usd",
  priceusd: "price_usd",
  usd: "price_usd",
  price_brl: "price_brl",
  pricebrl: "price_brl",
  brl: "price_brl",
  price_eur: "price_eur",
  priceeur: "price_eur",
  eur: "price_eur",
  stock_quantity: "stock_quantity",
  stock: "stock_quantity",
  unlimited_stock: "unlimited_stock",
  unlimited: "unlimited_stock",
  status: "status",
  shop: "status",
  main_image: "main_image",
  image: "main_image",
  image_2: "image_2",
  image_3: "image_3",
  short_en: "short_en",
  short_ptbr: "short_ptBR",
  desc_en: "desc_en",
  desc_ptbr: "desc_ptBR",
};

function normalizeHeader(raw: string): ImportSpreadsheetHeader | null {
  const trimmed = raw.trim();
  if ((IMPORT_SPREADSHEET_HEADERS as readonly string[]).includes(trimmed)) {
    return trimmed as ImportSpreadsheetHeader;
  }
  const key = trimmed.toLowerCase().replace(/[\s_/]+/g, "");
  return HEADER_ALIASES[trimmed.toLowerCase()] ?? HEADER_ALIASES[key] ?? null;
}

function resolveCategoryId(raw: string, catalog: ImportCatalog): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const byId = catalog.categories.find((c) => c.id === trimmed);
  if (byId) return byId.id;
  const lower = trimmed.toLowerCase();
  return catalog.categories.find((c) => c.name.toLowerCase() === lower)?.id ?? null;
}

function resolveSubcategoryId(
  raw: string,
  catalog: ImportCatalog,
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

function resolveBrandId(raw: string, catalog: ImportCatalog): string | null {
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
  if (value === "archived" || value === "scheduled") return value;
  return null;
}

export async function parseImportSpreadsheetFile(file: File): Promise<{
  records: Array<Partial<Record<ImportSpreadsheetHeader, string>>>;
  errors: string[];
}> {
  const buffer = await file.arrayBuffer();
  return parseImportSpreadsheetBuffer(buffer, file.name);
}

export function parseImportSpreadsheetBuffer(
  buffer: ArrayBuffer,
  fileName: string
): { records: Array<Partial<Record<ImportSpreadsheetHeader, string>>>; errors: string[] } {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { records: [], errors: ["Spreadsheet has no sheets."] };
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  if (!matrix.length) return { records: [], errors: ["Spreadsheet is empty."] };

  const headerRow = (matrix[0] ?? []).map((cell) => String(cell ?? ""));
  const mappedHeaders = headerRow.map(normalizeHeader);
  if (!mappedHeaders.some(Boolean)) {
    return {
      records: [],
      errors: [
        fileName.toLowerCase().endsWith(".csv")
          ? "Could not recognize CSV headers."
          : "Could not recognize spreadsheet headers.",
      ],
    };
  }

  const records: Array<Partial<Record<ImportSpreadsheetHeader, string>>> = [];
  for (let i = 1; i < matrix.length; i += 1) {
    const row = matrix[i] ?? [];
    const record: Partial<Record<ImportSpreadsheetHeader, string>> = {};
    let hasValue = false;
    mappedHeaders.forEach((header, index) => {
      if (!header) return;
      const value = String(row[index] ?? "").trim();
      if (value) hasValue = true;
      record[header] = value;
    });
    if (hasValue) records.push(record);
  }

  return { records, errors: [] };
}

function rowToProduct(
  cells: Partial<Record<ImportSpreadsheetHeader, string>>,
  catalog: ImportCatalog,
  rowNumber: number,
  errors: SpreadsheetImportError[]
): CmsProduct | null {
  const sku = (cells.sku ?? "").trim();
  if (!sku) {
    errors.push({
      row: rowNumber,
      sku: "",
      message: "SKU is required.",
      suggestedAction: "Fill the SKU column.",
    });
    return null;
  }
  const id = sku;

  const categoryRaw = cells.categoryId?.trim() ?? "";
  const brandRaw = cells.brandId?.trim() ?? "";
  const subcategoryRaw = cells.subcategoryId?.trim() ?? "";

  let categoryId = categoryRaw ? resolveCategoryId(categoryRaw, catalog) : "";
  if (categoryRaw && !categoryId) {
    errors.push({
      row: rowNumber,
      sku,
      message: `Unknown category "${categoryRaw}".`,
      suggestedAction: "Use a valid category id or name.",
    });
    categoryId = "";
  }

  let brandId = brandRaw ? resolveBrandId(brandRaw, catalog) : "";
  if (brandRaw && !brandId) {
    errors.push({
      row: rowNumber,
      sku,
      message: `Unknown brand "${brandRaw}".`,
      suggestedAction: "Use a valid brand id or name.",
    });
    brandId = "";
  }

  let subcategoryId = subcategoryRaw
    ? resolveSubcategoryId(subcategoryRaw, catalog, categoryId || undefined)
    : "";
  if (subcategoryRaw && !subcategoryId) {
    errors.push({
      row: rowNumber,
      sku,
      message: `Unknown subcategory "${subcategoryRaw}".`,
      suggestedAction: "Use a subcategory that belongs to the selected category.",
    });
    subcategoryId = "";
  }

  const fallbackCategory = catalog.categories[0];
  const fallbackSub = fallbackCategory?.subcategories[0];
  const fallbackBrand = catalog.brands[0];

  const enabledCountries = Object.fromEntries(
    catalog.countries.map((country) => [country.code, false])
  );

  const status = parseShopStatus(cells.status ?? "") ?? "draft";
  const moqRaw = cells.moq?.trim();
  let moq = 1;
  if (moqRaw) {
    const parsed = Number(moqRaw);
    if (!Number.isFinite(parsed) || parsed < 1 || !Number.isInteger(parsed)) {
      errors.push({
        row: rowNumber,
        sku,
        message: `Invalid MOQ "${moqRaw}".`,
        suggestedAction: "Use an integer ≥ 1.",
      });
    } else {
      moq = parsed;
    }
  }

  const base = createEmptyImportProduct({
    id,
    sku,
    categoryId: categoryId || fallbackCategory?.id || "",
    subcategoryId: subcategoryId || fallbackSub?.id || "",
    brandId: brandId || fallbackBrand?.id || "",
  });

  return {
    ...base,
    id,
    sku,
    moq,
    status,
    name: {
      en: cells.name_en ?? "",
      "pt-BR": cells.name_ptBR ?? "",
      es: cells.name_es ?? "",
      "zh-CN": cells.name_zhCN ?? "",
    },
    shortDescription: {
      en: cells.short_en ?? "",
      "pt-BR": cells.short_ptBR ?? "",
      es: "",
      "zh-CN": "",
    },
    description: {
      en: cells.desc_en ?? "",
      "pt-BR": cells.desc_ptBR ?? "",
      es: "",
      "zh-CN": "",
    },
    prices: {
      USD: (() => {
        const parsed = parsePriceInput(cells.price_usd || "", "USD");
        return typeof parsed === "number" ? parsed : 0;
      })(),
      BRL: (() => {
        const parsed = parsePriceInput(cells.price_brl || "", "BRL");
        return typeof parsed === "number" ? parsed : 0;
      })(),
      EUR: (() => {
        const parsed = parsePriceInput(cells.price_eur || "", "EUR");
        return typeof parsed === "number" ? parsed : 0;
      })(),
    },
    stockQuantity: cells.stock_quantity
      ? Number(cells.stock_quantity) || 0
      : null,
    unlimitedStock:
      cells.unlimited_stock === "1" ||
      cells.unlimited_stock?.toLowerCase() === "true" ||
      cells.unlimited_stock?.toLowerCase() === "yes" ||
      (!cells.stock_quantity && cells.unlimited_stock !== "0"),
    images: [cells.main_image || "", cells.image_2 || "", cells.image_3 || ""].filter(
      Boolean
    ),
    enabledCountries,
    availability: { ...enabledCountries },
  };
}

export function buildImportWorkspaceFromRecords(params: {
  records: Array<Partial<Record<ImportSpreadsheetHeader, string>>>;
  catalog: ImportCatalog;
}): {
  rows: ImportWorkspaceRow[];
  errors: SpreadsheetImportError[];
  truncated: boolean;
  totalParsed: number;
} {
  const { records, catalog } = params;
  const errors: SpreadsheetImportError[] = [];
  const products: CmsProduct[] = [];

  records.forEach((record, index) => {
    const product = rowToProduct(record, catalog, index + 2, errors);
    if (product) products.push(product);
  });

  const totalParsed = products.length;
  const truncated = totalParsed > BULK_IMPORT_MAX_PRODUCTS;
  const capped = products.slice(0, BULK_IMPORT_MAX_PRODUCTS);
  return {
    rows: capped.map(createImportWorkspaceRow),
    errors,
    truncated,
    totalParsed,
  };
}

export function downloadBulkImportTemplate() {
  const headers = [...IMPORT_SPREADSHEET_HEADERS];
  const sample = [
    "SKU-001",
    "Demo Product",
    "Produto Demo",
    "Producto Demo",
    "演示产品",
    "",
    "",
    "",
    "1",
    "100",
    "0",
    "0",
    "10",
    "0",
    "draft",
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800",
    "",
    "",
    "Short text EN",
    "Texto curto PT",
    "Description EN",
    "Descrição PT",
  ];
  const sheet = XLSX.utils.aoa_to_sheet([headers, sample]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Import");
  XLSX.writeFile(workbook, "oboya-bulk-import-template.xlsx");
}
