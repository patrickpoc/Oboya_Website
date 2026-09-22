import { describe, expect, it } from "vitest";
import {
  applyPatchToProduct,
  createWorkspaceRow,
  getChangedFields,
  isBulkFieldEqual,
} from "@/lib/cms/bulk-update/diff";
import { searchProductsForBulkUpdate } from "@/lib/cms/bulk-update/search-products";
import {
  mergeSpreadsheetIntoWorkspace,
  parseSpreadsheetBuffer,
} from "@/lib/cms/bulk-update/spreadsheet";
import { validateBulkUpdate } from "@/lib/cms/bulk-update/validate";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { BulkUpdateCatalog } from "@/lib/cms/bulk-update/types";
import * as XLSX from "xlsx";

function emptyLoc(en = "") {
  return { en, "pt-BR": "", es: "", "zh-CN": "" };
}

function makeProduct(partial: Partial<CmsProduct> & { id: string; sku: string }): CmsProduct {
  return {
    id: partial.id,
    sku: partial.sku,
    moq: partial.moq ?? 1,
    brandId: partial.brandId ?? "brand-1",
    categoryId: partial.categoryId ?? "cat-1",
    subcategoryId: partial.subcategoryId ?? "sub-1",
    images: partial.images ?? [],
    imageColorIds: [],
    tags: [],
    availability: {},
    prices: { USD: 10 },
    enabledCountries: { BR: true },
    application: partial.application ?? [],
    cultures: partial.cultures ?? [],
    certifications: partial.certifications ?? [],
    countryOfOrigin: partial.countryOfOrigin ?? "cn",
    stockStatus: "in_stock",
    stockQuantity: 10,
    unlimitedStock: false,
    specs: [],
    documents: [],
    relatedProductIds: [],
    defaultColor: "#000000",
    defaultColorName: { en: "Black" },
    colorVariants: [],
    name: partial.name ?? {
      en: "English Pot",
      "pt-BR": "Vaso Português",
      es: "Maceta Española",
      "zh-CN": "中文盆",
    },
    shortDescription: emptyLoc(),
    description: emptyLoc(),
    status: partial.status ?? "draft",
    seo: { title: emptyLoc(), description: emptyLoc() },
    deletedAt: null,
  };
}

const catalog: BulkUpdateCatalog = {
  categories: [
    {
      id: "cat-1",
      name: "Pots",
      subcategories: [
        { id: "sub-1", name: "Small Pots" },
        { id: "sub-2", name: "Large Pots" },
      ],
    },
    {
      id: "cat-2",
      name: "Containers",
      subcategories: [{ id: "sub-3", name: "Trays" }],
    },
  ],
  brands: [
    { id: "brand-1", name: "Oboya" },
    { id: "brand-2", name: "Other" },
  ],
  countries: [
    { code: "BR", name: "Brazil", currencies: ["BRL"], defaultCurrency: "BRL" },
    { code: "US", name: "United States", currencies: ["USD"], defaultCurrency: "USD" },
  ],
  filterOptions: {
    applications: [
      { id: "app-prop", name: "Propagation" },
      { id: "app-grow", name: "Growing" },
    ],
    cultures: [{ id: "crop-tomato", name: "Tomato" }],
    certifications: [{ id: "cert-iso", name: "ISO" }],
    countriesOfOrigin: [
      { id: "cn", name: "China" },
      { id: "nl", name: "Netherlands" },
    ],
  },
};

describe("searchProductsForBulkUpdate", () => {
  const products = [
    makeProduct({ id: "1", sku: "OBO-001", name: { en: "Black Pot", "pt-BR": "Vaso Preto", es: "", "zh-CN": "" } }),
    makeProduct({ id: "2", sku: "OBO-010", name: { en: "Tray", "pt-BR": "Bandeja", es: "", "zh-CN": "" } }),
    makeProduct({ id: "3", sku: "ABC-001", name: { en: "Other", "pt-BR": "Vaso Verde", es: "", "zh-CN": "" } }),
  ];

  it("ranks exact SKU first", () => {
    const result = searchProductsForBulkUpdate(products, "OBO-001");
    expect(result[0]?.sku).toBe("OBO-001");
  });

  it("matches multilingual names", () => {
    const result = searchProductsForBulkUpdate(products, "Vaso Preto");
    expect(result.some((product) => product.sku === "OBO-001")).toBe(true);
  });

  it("returns at most 3 results", () => {
    const many = Array.from({ length: 10 }, (_, index) =>
      makeProduct({ id: String(index), sku: `POT-${index}`, name: { en: `Pot ${index}`, "pt-BR": "", es: "", "zh-CN": "" } })
    );
    expect(searchProductsForBulkUpdate(many, "Pot").length).toBeLessThanOrEqual(3);
  });

  it("excludes already selected ids", () => {
    const result = searchProductsForBulkUpdate(products, "OBO", {
      excludeIds: new Set(["1"]),
    });
    expect(result.every((product) => product.id !== "1")).toBe(true);
  });
});

describe("diff", () => {
  it("detects changed fields only", () => {
    const original = makeProduct({ id: "1", sku: "A" });
    const pending = applyPatchToProduct(original, { moq: 200, brandId: "brand-2" });
    expect(getChangedFields(original, pending).sort()).toEqual(["brandId", "moq"]);
    expect(isBulkFieldEqual("categoryId", original, pending)).toBe(true);
  });
});

describe("validateBulkUpdate", () => {
  it("blocks incompatible category/subcategory", () => {
    const original = makeProduct({ id: "1", sku: "A" });
    const row = createWorkspaceRow(original);
    row.pending = applyPatchToProduct(row.pending, {
      categoryId: "cat-1",
      subcategoryId: "sub-3",
    });
    row.changedFields = getChangedFields(row.original, row.pending);
    const issues = validateBulkUpdate([row], catalog);
    expect(issues.some((issue) => issue.status === "blocked" && issue.field === "subcategoryId")).toBe(
      true
    );
  });

  it("blocks shop publish without taxonomy", () => {
    const original = makeProduct({
      id: "1",
      sku: "A",
      categoryId: "",
      subcategoryId: "",
      brandId: "",
      status: "draft",
    });
    const row = createWorkspaceRow(original);
    row.pending = applyPatchToProduct(row.pending, { status: "published" });
    row.changedFields = getChangedFields(row.original, row.pending);
    const issues = validateBulkUpdate([row], catalog);
    expect(issues.some((issue) => issue.status === "blocked" && issue.field === "status")).toBe(
      true
    );
  });
});

describe("spreadsheet empty cells", () => {
  it("keeps current values for empty cells", () => {
    const product = makeProduct({
      id: "1",
      sku: "SKU-001",
      moq: 50,
      brandId: "brand-1",
      categoryId: "cat-1",
    });
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["SKU", "MOQ", "Category", "Brand"],
      ["SKU-001", "200", "Containers", ""],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Bulk");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const parsed = parseSpreadsheetBuffer(buffer, "test.xlsx");
    expect(parsed.errors).toEqual([]);

    const result = mergeSpreadsheetIntoWorkspace({
      records: parsed.records,
      productsBySku: new Map([["sku-001", product]]),
      existingRows: [],
      catalog,
    });

    expect(result.errors).toEqual([]);
    expect(result.rows[0]?.pending.moq).toBe(200);
    expect(result.rows[0]?.pending.categoryId).toBe("cat-2");
    expect(result.rows[0]?.pending.brandId).toBe("brand-1");
  });

  it("reports duplicate SKU rows", () => {
    const product = makeProduct({ id: "1", sku: "SKU-001" });
    const result = mergeSpreadsheetIntoWorkspace({
      records: [
        { SKU: "SKU-001", MOQ: "10" },
        { SKU: "SKU-001", MOQ: "20" },
      ],
      productsBySku: new Map([["sku-001", product]]),
      existingRows: [],
      catalog,
    });
    expect(result.errors.some((error) => error.message.includes("Duplicate"))).toBe(true);
  });
});
