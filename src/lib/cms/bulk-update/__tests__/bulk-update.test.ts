import { describe, expect, it } from "vitest";
import {
  applyPatchToProduct,
  createWorkspaceGroup,
  createWorkspaceRow,
  getChangedFields,
  isBulkFieldEqual,
  productHasPendingChanges,
} from "@/lib/cms/bulk-update/diff";
import { searchProductsForBulkUpdate, searchSkuHitsForBulkUpdate } from "@/lib/cms/bulk-update/search-products";
import {
  mergeSpreadsheetIntoWorkspace,
  parseSpreadsheetBuffer,
} from "@/lib/cms/bulk-update/spreadsheet";
import { validateBulkUpdate } from "@/lib/cms/bulk-update/validate";
import {
  collectAllSkus,
  expandSkuGroup,
  resolveSku,
} from "@/lib/cms/admin-sku-lookup";
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
    colorVariants: partial.colorVariants ?? [],
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

describe("admin-sku-lookup", () => {
  const product = makeProduct({
    id: "1",
    sku: "OBO-001",
    colorVariants: [
      {
        id: "red",
        name: "Red",
        nameI18n: { en: "Red" },
        sku: "OBO-001-RED",
        color: "#ff0000",
        image: "/red.jpg",
        prices: { USD: 12 },
        sortOrder: 0,
      },
    ],
  });

  it("resolves parent and child SKUs", () => {
    expect(resolveSku([product], "OBO-001")?.variantId).toBeNull();
    expect(resolveSku([product], "OBO-001-RED")?.variantId).toBe("red");
  });

  it("expands parent + children", () => {
    const rows = expandSkuGroup(product);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.kind).toBe("parent");
    expect(rows[1]?.kind).toBe("variant");
  });

  it("collects all skus", () => {
    const skus = collectAllSkus([product]);
    expect(skus.has("obo-001")).toBe(true);
    expect(skus.has("obo-001-red")).toBe(true);
  });
});

describe("searchProductsForBulkUpdate", () => {
  const products = [
    makeProduct({
      id: "1",
      sku: "OBO-001",
      name: { en: "Black Pot", "pt-BR": "Vaso Preto", es: "", "zh-CN": "" },
      colorVariants: [
        {
          id: "green",
          name: "Green",
          nameI18n: { en: "Green" },
          sku: "OBO-001-GRN",
          color: "#00ff00",
          image: "/g.jpg",
          prices: {},
          sortOrder: 0,
        },
      ],
    }),
    makeProduct({ id: "2", sku: "OBO-010", name: { en: "Tray", "pt-BR": "Bandeja", es: "", "zh-CN": "" } }),
    makeProduct({ id: "3", sku: "ABC-001", name: { en: "Other", "pt-BR": "Vaso Verde", es: "", "zh-CN": "" } }),
  ];

  it("ranks exact SKU first", () => {
    const result = searchProductsForBulkUpdate(products, "OBO-001");
    expect(result[0]?.sku).toBe("OBO-001");
  });

  it("matches child SKU with hint", () => {
    const hits = searchSkuHitsForBulkUpdate(products, "OBO-001-GRN");
    expect(hits[0]?.isChildSku).toBe(true);
    expect(hits[0]?.matchedSku).toBe("OBO-001-GRN");
    expect(hits[0]?.product.sku).toBe("OBO-001");
  });

  it("matches color name exactly and by partial correspondence", () => {
    const exact = searchSkuHitsForBulkUpdate(products, "Green");
    expect(exact[0]?.isChildSku).toBe(true);
    expect(exact[0]?.variantId).toBe("green");

    const partial = searchSkuHitsForBulkUpdate(products, "gre");
    expect(partial.some((hit) => hit.variantId === "green")).toBe(true);
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

  it("expands workspace group for colors", () => {
    const product = makeProduct({
      id: "1",
      sku: "A",
      colorVariants: [
        {
          id: "v1",
          name: "Blue",
          nameI18n: { en: "Blue" },
          sku: "A-BLUE",
          color: "#0000ff",
          image: "/b.jpg",
          prices: {},
          sortOrder: 0,
        },
      ],
    });
    const group = createWorkspaceGroup(product);
    expect(group).toHaveLength(2);
    expect(group.every((row) => row.productId === "1")).toBe(true);
  });

  it("patches variant price without touching product.prices", () => {
    const original = makeProduct({
      id: "1",
      sku: "A",
      colorVariants: [
        {
          id: "v1",
          name: "Blue",
          nameI18n: { en: "Blue" },
          sku: "A-BLUE",
          moq: 1,
          color: "#0000ff",
          image: "/b.jpg",
          prices: {},
          sortOrder: 0,
        },
      ],
    });
    const pending = applyPatchToProduct(original, { variantPriceUsd: 22 }, "v1");
    expect(pending.prices?.USD).toBe(10);
    expect(pending.colorVariants[0]?.prices?.USD).toBe(22);
    expect(productHasPendingChanges(original, pending)).toBe(true);
  });

  it("patches variant MOQ without touching product.moq", () => {
    const original = makeProduct({
      id: "1",
      sku: "A",
      moq: 1,
      colorVariants: [
        {
          id: "v1",
          name: "Blue",
          nameI18n: { en: "Blue" },
          sku: "A-BLUE",
          moq: 1,
          color: "#0000ff",
          image: "/b.jpg",
          prices: {},
          sortOrder: 0,
        },
      ],
    });
    const pending = applyPatchToProduct(original, { variantMoq: 50 }, "v1");
    expect(pending.moq).toBe(1);
    expect(pending.colorVariants[0]?.moq).toBe(50);
    expect(
      getChangedFields(original, pending, { kind: "variant", variantId: "v1" })
    ).toEqual(["variantMoq"]);
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
    const parent = result.rows.find((row) => row.kind === "parent");
    expect(parent?.pending.moq).toBe(200);
    expect(parent?.pending.categoryId).toBe("cat-2");
    expect(parent?.pending.brandId).toBe("brand-1");
  });

  it("expands group when spreadsheet uses child SKU", () => {
    const product = makeProduct({
      id: "1",
      sku: "SKU-001",
      colorVariants: [
        {
          id: "v1",
          name: "Red",
          nameI18n: { en: "Red" },
          sku: "SKU-001-RED",
          moq: 1,
          color: "#ff0000",
          image: "/r.jpg",
          prices: {},
          sortOrder: 0,
        },
      ],
    });
    const result = mergeSpreadsheetIntoWorkspace({
      records: [{ SKU: "SKU-001-RED", MOQ: "25", "Variant price USD": "15" }],
      productsBySku: new Map([["sku-001", product]]),
      existingRows: [],
      catalog,
      products: [product],
    });
    expect(result.errors).toEqual([]);
    expect(result.rows.some((row) => row.kind === "parent")).toBe(true);
    expect(result.rows.some((row) => row.kind === "variant")).toBe(true);
    const variant = result.rows.find((row) => row.kind === "variant")?.pending.colorVariants[0];
    expect(variant?.prices?.USD).toBe(15);
    expect(variant?.moq).toBe(25);
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
