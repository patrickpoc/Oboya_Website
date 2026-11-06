import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { diffJson } from "@/lib/cms/approvals/diff";
import { buildSkuOwners } from "@/lib/cms/admin-sku-lookup";
import { toBulkWritePayload } from "@/lib/cms/bulk-update/apply-sequential";
import {
  applyPatchToProduct,
  createWorkspaceGroup,
  formatFieldValue,
  getChangedFields,
  isBulkFieldEqual,
  syncGroupPending,
} from "@/lib/cms/bulk-update/diff";
import { formatFieldDisplayValue } from "@/lib/cms/bulk-update/display-labels";
import {
  buildTemplateRows,
  mergeSpreadsheetIntoWorkspace,
  parseSpreadsheetBuffer,
} from "@/lib/cms/bulk-update/spreadsheet";
import type {
  BulkEditableField,
  BulkProductPatch,
  BulkUpdateCatalog,
  BulkWorkspaceRow,
} from "@/lib/cms/bulk-update/types";
import {
  buildRowsFromUpdates,
  issuesForProduct,
  mergeIssues,
  validateBulkUpdate,
} from "@/lib/cms/bulk-update/validate";
import { colorDataChanged, findVariantProblem } from "@/lib/cms/bulk-update/variant-guard";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { ProductColorVariant } from "@/lib/shop/types";

const loc = (en = "") => ({ en, "pt-BR": "", es: "", "zh-CN": "" });

function variant(over: Partial<ProductColorVariant> & { id: string; sku: string }): ProductColorVariant {
  return {
    name: "Red",
    nameI18n: { en: "Red", "pt-BR": "Vermelho", es: "Rojo", "zh-CN": "红" },
    moq: 1,
    color: "#ff0000",
    image: "/red.jpg",
    prices: { USD: 5 },
    sortOrder: 0,
    ...over,
  };
}

function product(over: Partial<CmsProduct> & { id: string; sku: string }): CmsProduct {
  return {
    moq: 1,
    categoryId: "cat-1",
    subcategoryId: "sub-1",
    images: ["/p.jpg", "/p2.jpg"],
    imageColorIds: [["red"], []],
    tags: [],
    availability: {},
    prices: { USD: 10 },
    enabledCountries: { BR: true },
    application: [],
    cultures: [],
    certifications: [],
    countryOfOrigin: "",
    stockStatus: "in_stock",
    stockQuantity: 1,
    unlimitedStock: false,
    specs: [],
    documents: [],
    relatedProductIds: [],
    defaultColor: "#000000",
    defaultColorName: { en: "Black", "pt-BR": "Preto", es: "Negro", "zh-CN": "黑" },
    featuredColorId: "red",
    colorVariants: [variant({ id: "red", sku: "P-RED" }), variant({ id: "blue", sku: "P-BLUE", name: "Blue", nameI18n: { en: "Blue" }, color: "#0000ff", sortOrder: 1 })],
    name: loc("Pot"),
    shortDescription: loc(),
    description: { en: "<p>Long text</p>", "pt-BR": "", es: "", "zh-CN": "" },
    status: "draft",
    seo: { title: loc(), description: loc() },
    deletedAt: null,
    ...over,
  } as CmsProduct;
}

const catalog: BulkUpdateCatalog = {
  categories: [{ id: "cat-1", name: "Pots", subcategories: [{ id: "sub-1", name: "Small" }] }],
  countries: [{ code: "BR", name: "Brazil", currencies: ["BRL"], defaultCurrency: "BRL" }],
  filterOptions: { applications: [], cultures: [], certifications: [], countriesOfOrigin: [] },
};

/** Edits one variant through the real patch + sync path, as the workspace does. */
function edit(base: CmsProduct, variantId: string, patch: BulkProductPatch) {
  const group = createWorkspaceGroup(base);
  const pending = applyPatchToProduct(group[0]!.pending, patch, variantId);
  return syncGroupPending(group, base.id, pending);
}
const variantRow = (rows: BulkWorkspaceRow[], id: string) => rows.find((r) => r.variantId === id)!;

describe("every new variant field round-trips", () => {
  const cases: Array<[BulkEditableField, BulkProductPatch, string, string]> = [
    ["variantSku", { variantSku: "P-RED-2" }, "P-RED", "P-RED-2"],
    ["variantColor", { variantColor: "#00ff00" }, "#ff0000", "#00ff00"],
    ["variantNameEn", { variantNameEn: "Scarlet" }, "Red", "Scarlet"],
    ["variantNamePt", { variantNamePt: "Escarlate" }, "Vermelho", "Escarlate"],
    ["variantNameEs", { variantNameEs: "Escarlata" }, "Rojo", "Escarlata"],
    ["variantNameZh", { variantNameZh: "绯红" }, "红", "绯红"],
    ["variantImage", { variantImage: "https://cdn.example.com/x.jpg" }, "/red.jpg", "https://cdn.example.com/x.jpg"],
    ["variantSortOrder", { variantSortOrder: 4 }, "0", "4"],
  ];

  it.each(cases)("%s: changed state, patch, formatting", (field, patch, before, after) => {
    const base = product({ id: "1", sku: "P" });
    const rows = edit(base, "red", patch);
    const row = variantRow(rows, "red");
    expect(row.changedFields).toEqual([field]);
    expect(getChangedFields(row.original, row.pending, { kind: "variant", variantId: "red" })).toEqual([field]);
    expect(isBulkFieldEqual(field, row.original, row.pending, "red")).toBe(false);
    expect(formatFieldValue(field, row.original, "red")).toBe(before);
    expect(formatFieldValue(field, row.pending, "red")).toBe(after);
    expect(formatFieldDisplayValue(field, row.pending, catalog, "en", "red")).toBe(after);
    // The sibling color is untouched and reports no change.
    expect(variantRow(rows, "blue").changedFields).toEqual([]);
  });

  const parentCases: Array<[BulkEditableField, BulkProductPatch, string]> = [
    ["defaultColor", { defaultColor: "#111111" }, "#111111"],
    ["defaultColorNameEn", { defaultColorNameEn: "Jet" }, "Jet"],
    ["defaultColorNamePt", { defaultColorNamePt: "Azeviche" }, "Azeviche"],
    ["defaultColorNameEs", { defaultColorNameEs: "Azabache" }, "Azabache"],
    ["defaultColorNameZh", { defaultColorNameZh: "墨" }, "墨"],
  ];
  it.each(parentCases)("parent %s", (field, patch, after) => {
    const base = product({ id: "1", sku: "P" });
    const original = createWorkspaceGroup(base)[0]!;
    const pending = applyPatchToProduct(original.pending, patch);
    expect(getChangedFields(original.original, pending, { kind: "parent" })).toEqual([field]);
    expect(formatFieldValue(field, pending)).toBe(after);
    expect(formatFieldDisplayValue(field, pending, catalog)).toBe(after);
  });

  it("an English name edit updates nameI18n.en and the legacy name", () => {
    const rows = edit(product({ id: "1", sku: "P" }), "red", { variantNameEn: "Scarlet" });
    const v = variantRow(rows, "red").pending.colorVariants[0]!;
    expect(v.nameI18n?.en).toBe("Scarlet");
    expect(v.name).toBe("Scarlet");
    expect(v.nameI18n?.["pt-BR"]).toBe("Vermelho");
  });

  it("a SKU edit keeps id, featuredColorId and imageColorIds", () => {
    const base = product({ id: "1", sku: "P" });
    const rows = edit(base, "red", { variantSku: "NEW-SKU" });
    const row = variantRow(rows, "red");
    expect(row.variantId).toBe("red");
    expect(row.rowId).toBe("1::red"); // stable key: the input keeps focus while typing
    expect(row.matchedSku).toBe("NEW-SKU");
    expect(row.pending.colorVariants[0]!.id).toBe("red");
    expect(row.pending.featuredColorId).toBe("red");
    expect(row.pending.imageColorIds).toEqual([["red"], []]);
  });

  it("existing MOQ and price editing still work", () => {
    const rows = edit(product({ id: "1", sku: "P" }), "red", { variantMoq: 20, variantPriceUsd: 9 });
    expect(variantRow(rows, "red").changedFields.sort()).toEqual(["variantMoq", "variantPriceUsd"]);
  });
});

describe("variant validation", () => {
  const base = product({ id: "1", sku: "P" });
  const issuesFor = (patch: BulkProductPatch, cat: BulkUpdateCatalog = catalog, id = "red") =>
    validateBulkUpdate(edit(base, id, patch), cat).filter((i) => i.status === "blocked");

  it.each<[string, BulkProductPatch, BulkEditableField]>([
    ["invalid hex", { variantColor: "red" }, "variantColor"],
    ["short hex", { variantColor: "#fff" }, "variantColor"],
    ["empty EN name", { variantNameEn: "  " }, "variantNameEn"],
    ["empty SKU", { variantSku: "" }, "variantSku"],
    ["empty image", { variantImage: "" }, "variantImage"],
    ["http image", { variantImage: "http://cdn.example.com/a.jpg" }, "variantImage"],
    ["javascript image", { variantImage: "javascript:alert(1)" }, "variantImage"],
    ["data image", { variantImage: "data:image/png;base64,AAAA" }, "variantImage"],
    ["protocol-relative image", { variantImage: "//evil.example.com/a.jpg" }, "variantImage"],
    ["negative sort order", { variantSortOrder: -1 }, "variantSortOrder"],
    ["fractional sort order", { variantSortOrder: 1.5 }, "variantSortOrder"],
  ])("blocks %s", (_label, patch, field) => {
    expect(issuesFor(patch).some((i) => i.field === field)).toBe(true);
  });

  it("accepts https and relative images and a valid change", () => {
    expect(issuesFor({ variantImage: "https://cdn.example.com/a.jpg" })).toEqual([]);
    expect(issuesFor({ variantImage: "/assets/a.jpg" })).toEqual([]);
    expect(issuesFor({ variantSku: "OK-1", variantColor: "#00ff00", variantSortOrder: 3 })).toEqual([]);
  });

  it("blocks a SKU duplicated inside the product or equal to the parent SKU", () => {
    expect(issuesFor({ variantSku: "p-blue" }).some((i) => i.field === "variantSku")).toBe(true);
    expect(issuesFor({ variantSku: "P" }).some((i) => i.field === "variantSku")).toBe(true);
  });

  it("blocks a SKU owned by another product (trashed included)", () => {
    const other = product({ id: "2", sku: "OTHER", deletedAt: "2026-01-01", colorVariants: [variant({ id: "x", sku: "TAKEN" })] });
    const cat = { ...catalog, skuOwners: buildSkuOwners([base, other]) };
    const found = issuesFor({ variantSku: "taken" }, cat);
    expect(found.find((i) => i.field === "variantSku")?.message).toMatch(/belongs to product "2"/);
    // Keeping the current SKU is never reported, even though this product owns it.
    expect(issuesFor({ variantMoq: 3 }, cat)).toEqual([]);
  });

  it("blocks the same SKU claimed by two products in one batch", () => {
    const a = product({ id: "1", sku: "A", colorVariants: [variant({ id: "red", sku: "A-RED" })] });
    const b = product({ id: "2", sku: "B", colorVariants: [variant({ id: "red", sku: "B-RED" })] });
    const rows = [
      ...edit(a, "red", { variantSku: "SHARED" }),
      ...edit(b, "red", { variantSku: "shared" }),
    ];
    const issues = validateBulkUpdate(rows, catalog).filter((i) => i.field === "variantSku");
    expect(issues).toHaveLength(2);
    expect(issues.map((i) => i.productId).sort()).toEqual(["1", "2"]);
  });

  it("scopes an issue to the variant that has it, not its siblings", () => {
    const group = createWorkspaceGroup(base);
    let pending = applyPatchToProduct(group[0]!.pending, { variantColor: "bad" }, "red");
    pending = applyPatchToProduct(pending, { variantColor: "bad" }, "blue");
    const rows = syncGroupPending(group, "1", pending);
    const issues = validateBulkUpdate(rows, catalog).filter((i) => i.field === "variantColor");
    expect(issues.map((i) => i.variantId).sort()).toEqual(["blue", "red"]);
    expect(issuesForProduct(issues, "1", "variantColor", "red")).toHaveLength(1);
    expect(issuesForProduct(issues, "1", "variantColor", "blue")).toHaveLength(1);
    expect(issuesForProduct(issues, "1", "variantColor", null)).toHaveLength(0);
    // Same field and message on two variants: both survive the client/server merge.
    expect(issues[0]!.message).toBe(issues[1]!.message);
    expect(mergeIssues(issues, issues)).toHaveLength(2);
  });

  it("warns (does not block) when a variant image host is not in the storefront allowlist", () => {
    const issues = validateBulkUpdate(
      edit(base, "red", { variantImage: "https://cdn.example.com/a.jpg" }),
      catalog
    ).filter((i) => i.field === "variantImage");
    expect(issues.map((i) => i.status)).toEqual(["warning"]);
    const site = validateBulkUpdate(edit(base, "red", { variantImage: "/assets/a.jpg" }), catalog);
    expect(site.filter((i) => i.field === "variantImage" && i.status !== "valid")).toHaveLength(0);
  });

  it("only a single edited variant carries an issue", () => {
    const issues = validateBulkUpdate(edit(base, "red", { variantColor: "bad" }), catalog);
    expect(issuesForProduct(issues, "1", "variantColor", "blue")).toHaveLength(0);
  });

  it("surfaces the product-level colorVariants block (no cell can show it)", () => {
    const issues = validateBulkUpdate(
      edit(base, "red", { variantNameEn: "Blue" }), // collides with the other color's name
      catalog
    );
    const productLevel = issues.find((i) => i.field === "colorVariants");
    expect(productLevel?.status).toBe("blocked");
    expect(productLevel?.variantId).toBeUndefined();
  });
});

describe("server-side update validation skips the stored-variant check", () => {
  const colorIssues = (p: CmsProduct, patch: BulkProductPatch, skip: boolean) =>
    validateBulkUpdate(
      buildRowsFromUpdates(new Map([[p.id, p]]), [{ id: p.id, patch }]),
      catalog,
      { skipColorVariantCheck: skip }
    ).filter((i) => i.field === "colorVariants");

  it("a repair: stored variant is invalid, the client repairs it, the server must not block", () => {
    const legacy = product({
      id: "1",
      sku: "P",
      colorVariants: [variant({ id: "red", sku: "P-RED", color: "oops" })],
    });
    expect(colorIssues(legacy, { priceUsd: 9 }, false)).toHaveLength(1); // what the client sees
    expect(colorIssues(legacy, { priceUsd: 9 }, true)).toHaveLength(0);
  });

  it("a rename: default color name takes a stored variant's name while that variant is renamed", () => {
    const p = product({ id: "1", sku: "P" });
    expect(colorIssues(p, { defaultColorNameEn: "Blue" }, false).length).toBeGreaterThan(0);
    expect(colorIssues(p, { defaultColorNameEn: "Blue" }, true)).toHaveLength(0);
  });

  it("the client-side check (no skip) still blocks the final combined state", () => {
    const issues = validateBulkUpdate(edit(product({ id: "1", sku: "P" }), "red", { variantNameEn: "Blue" }), catalog);
    expect(issues.some((i) => i.field === "colorVariants" && i.status === "blocked")).toBe(true);
  });
});

describe("approval diff", () => {
  it("shows colorVariants[<id>].<field> paths", () => {
    const base = product({ id: "1", sku: "P" });
    const pending = edit(base, "red", { variantSku: "P-RED-2", variantNameZh: "绯红" })[0]!.pending;
    const paths = diffJson(base, pending).map((entry) => entry.path);
    expect(paths.some((p) => /^colorVariants\[.*red.*\]\.sku$/.test(p) || /colorVariants.*red.*sku/.test(p))).toBe(true);
    expect(paths.some((p) => /red.*nameI18n\.zh-CN/.test(p))).toBe(true);
  });
});

describe("description is never overwritten by a list-loaded row", () => {
  it("toBulkWritePayload drops description", () => {
    const base = product({ id: "1", sku: "P" });
    expect(toBulkWritePayload(base)).not.toHaveProperty("description");
  });
});

describe("variant guard (server rule)", () => {
  const stored = product({ id: "1", sku: "P" });
  const others = [product({ id: "2", sku: "Q", deletedAt: "2026-01-01", colorVariants: [variant({ id: "z", sku: "Q-Z" })] })];
  const withVariants = (v: ProductColorVariant[]) => ({ ...stored, colorVariants: v });

  it("does nothing when color data is unchanged, even for a legacy invalid product", () => {
    const legacy = { ...stored, defaultColor: "", colorVariants: [variant({ id: "red", sku: "", image: "" })] };
    expect(colorDataChanged(legacy, legacy)).toBe(false);
    expect(findVariantProblem({ ...legacy, moq: 99 }, legacy, others)).toBeNull();
  });

  it("rejects invalid data once colorVariants changed", () => {
    const next = withVariants([variant({ id: "red", sku: "P-RED", color: "nope" })]);
    expect(findVariantProblem(next, stored, others)).toMatch(/hex/);
  });

  it("rejects a SKU owned by another product, including a trashed one", () => {
    const next = withVariants([variant({ id: "red", sku: "q-z" })]);
    expect(findVariantProblem(next, stored, others)).toMatch(/belongs to product "2"/);
    expect(findVariantProblem(withVariants([variant({ id: "red", sku: "Q" })]), stored, others)).toMatch(/belongs to product "2"/);
  });

  it("rejects an unsafe image or bad sort order on a changed variant only", () => {
    expect(findVariantProblem(withVariants([variant({ id: "red", sku: "P-RED", image: "http://x/y.jpg" })]), stored, others)).toMatch(/https/);
    expect(findVariantProblem(withVariants([variant({ id: "red", sku: "P-RED", sortOrder: -2 })]), stored, others)).toMatch(/sort order/);
  });

  it("accepts a valid change and a default-color-only change", () => {
    expect(findVariantProblem(withVariants([variant({ id: "red", sku: "P-RED-2" })]), stored, others)).toBeNull();
    expect(findVariantProblem({ ...stored, defaultColor: "zzz" }, stored, others)).toMatch(/default color/);
  });
});

describe("spreadsheet", () => {
  const base = product({ id: "1", sku: "P" });
  const run = (records: Array<Record<string, string>>) =>
    mergeSpreadsheetIntoWorkspace({
      records,
      productsBySku: new Map([["p", base]]),
      existingRows: [],
      catalog,
      products: [base],
    });

  it("applies Color hex / Color name / Variant image / New SKU / Sort order to a child SKU", () => {
    const result = run([
      {
        SKU: "P-RED",
        "Color hex": "#00ff00",
        "Color name": "Green",
        "Color name PT": "Verde",
        "Color name ES": "Verde",
        "Color name ZH": "绿",
        "Variant image": "https://cdn.example.com/g.jpg",
        "New SKU": "P-GREEN",
        "Sort order": "2",
      },
    ]);
    expect(result.errors).toEqual([]);
    const v = result.rows.find((r) => r.variantId === "red")!.pending.colorVariants[0]!;
    expect(v).toMatchObject({ id: "red", sku: "P-GREEN", color: "#00ff00", image: "https://cdn.example.com/g.jpg", sortOrder: 2 });
    expect(v.nameI18n).toMatchObject({ en: "Green", "pt-BR": "Verde", es: "Verde", "zh-CN": "绿" });
    expect(result.rows.find((r) => r.kind === "parent")!.pending.defaultColor).toBe("#000000");
  });

  it("applies Color hex / Color name to the default color on a parent SKU", () => {
    const result = run([{ SKU: "P", "Color hex": "#222222", "Color name": "Coal", "Color name ZH": "煤" }]);
    expect(result.errors).toEqual([]);
    const parent = result.rows.find((r) => r.kind === "parent")!.pending;
    expect(parent.defaultColor).toBe("#222222");
    expect(parent.defaultColorName).toMatchObject({ en: "Coal", "zh-CN": "煤", "pt-BR": "Preto" });
    expect(parent.colorVariants[0]!.color).toBe("#ff0000");
  });

  it("empty cells keep current values", () => {
    const result = run([{ SKU: "P-RED", "Color hex": "", "Color name": "", "Variant image": "", "Sort order": "" }]);
    expect(result.rows.find((r) => r.variantId === "red")!.changedFields).toEqual([]);
  });

  it("reports an invalid sort order and ignores variant-only columns on a parent", () => {
    expect(run([{ SKU: "P-RED", "Sort order": "-3" }]).errors[0]!.message).toMatch(/Invalid Sort order/);
    expect(run([{ SKU: "P", "New SKU": "X" }]).errors[0]!.message).toMatch(/color \(child\) SKUs only/);
  });

  function sheet(rows: string[][]) {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "S");
    return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  }

  it("a sheet with the legacy Brand / brandId columns still parses, and the value is ignored", () => {
    for (const header of ["Brand", "brandId", "Brand ID"]) {
      const parsed = parseSpreadsheetBuffer(sheet([["SKU", header, "MOQ"], ["P", "oboya", "9"]]), "old.xlsx");
      expect(parsed.errors).toEqual([]);
      expect(parsed.records[0]).not.toHaveProperty("Brand");
      expect(parsed.records[0]!.MOQ).toBe("9");
    }
  });

  it("a sheet without any of the new columns parses; genuinely unknown columns still error", () => {
    expect(parseSpreadsheetBuffer(sheet([["SKU", "MOQ"], ["P", "9"]]), "a.xlsx").errors).toEqual([]);
    expect(parseSpreadsheetBuffer(sheet([["SKU", "Whatever"], ["P", "9"]]), "a.xlsx").errors).toEqual(['Unknown column "Whatever".']);
  });

  it("template: no Brand column, new columns present, sample aligned to headers", () => {
    const { headers, sample } = buildTemplateRows();
    expect(headers).not.toContain("Brand");
    expect(headers).toEqual(expect.arrayContaining(["New SKU", "Sort order", "Color name PT", "Color name ES", "Color name ZH", "Color hex", "Variant image"]));
    expect(sample).toHaveLength(headers.length);
    expect(sample[headers.indexOf("SKU")]).toBe("SKU-001");
    expect(sample[headers.indexOf("MOQ")]).toBe("100");
    expect(sample[headers.indexOf("Market availability")]).toBe("BR;US");
    expect(sample[headers.indexOf("Sale mode")]).toBe("stock");
  });
});
