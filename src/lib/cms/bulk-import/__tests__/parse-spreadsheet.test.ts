import { describe, expect, it } from "vitest";
import { parseImportSpreadsheetBuffer } from "../parse-spreadsheet";
import * as XLSX from "xlsx";
import {
  buildImportTemplateRows,
  buildImportWorkspaceFromRecords,
  IMPORT_SPREADSHEET_HEADERS,
} from "../parse-spreadsheet";
import { applyImportPatch, getImportChangedFields } from "../diff";
import { validateBulkImport } from "../validate";
import type { ImportCatalog } from "../types";

const PT = "Fita adesiva acrílica";
const ZH = "0.5英寸透明亚克力胶带";
const csv = `name_ptBR,name_zhCN\n${PT},${ZH}\n`;

function toBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

describe("parseImportSpreadsheetBuffer csv encoding", () => {
  const body = new TextEncoder().encode(csv);
  const bom = new Uint8Array([0xef, 0xbb, 0xbf, ...body]);

  it.each([
    ["without BOM", body],
    ["with BOM", bom],
  ])("keeps UTF-8 text intact %s", (_label, bytes) => {
    const { records } = parseImportSpreadsheetBuffer(toBuffer(bytes), "products.csv");
    expect(records[0]?.name_ptBR).toBe(PT);
    expect(records[0]?.name_zhCN).toBe(ZH);
  });
});

const catalog: ImportCatalog = {
  categories: [{ id: "cat-1", name: "Pots", subcategories: [{ id: "sub-1", name: "Small" }] }],
  countries: [{ code: "BR", name: "Brazil", currencies: ["BRL"], defaultCurrency: "BRL" }],
  filterOptions: { applications: [], cultures: [], certifications: [], countriesOfOrigin: [] },
  existingSkus: new Set(),
  existingIds: new Set(),
};

function sheet(rows: string[][], name = "i.xlsx") {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "S");
  return parseImportSpreadsheetBuffer(XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer, name);
}
const build = (records: ReturnType<typeof sheet>["records"]) =>
  buildImportWorkspaceFromRecords({ records, catalog });

describe("import template", () => {
  it("has all four short and long description columns and no brand column", () => {
    const { headers } = buildImportTemplateRows();
    expect(headers).toEqual(
      expect.arrayContaining(["short_en", "short_ptBR", "short_es", "short_zhCN", "desc_en", "desc_ptBR", "desc_es", "desc_zhCN"])
    );
    expect(headers).not.toContain("brandId");
    expect(headers).toEqual([...IMPORT_SPREADSHEET_HEADERS]);
  });

  it("keeps the sample row aligned: every value lands under its own header", () => {
    const { headers, sample } = buildImportTemplateRows();
    expect(sample).toHaveLength(headers.length);
    const at = (h: string) => sample[headers.indexOf(h)];
    expect(at("sku")).toBe("SKU-001");
    expect(at("name_zhCN")).toBe("演示产品");
    expect(at("moq")).toBe("1");
    expect(at("price_usd")).toBe("100");
    expect(at("status")).toBe("draft");
    expect(at("main_image")).toMatch(/^https:\/\//);
    expect(at("short_en")).toBe("Short text EN");
    expect(at("short_ptBR")).toBe("Texto curto PT");
    expect(at("short_es")).toBe("Texto corto ES");
    expect(at("short_zhCN")).toBe("简短说明");
    expect(at("desc_es")).toBe("Descripción ES");
    expect(at("desc_zhCN")).toBe("详细说明");
  });

  it("the template itself imports cleanly end to end", () => {
    const { headers, sample } = buildImportTemplateRows();
    const parsed = sheet([headers, sample]);
    expect(parsed.errors).toEqual([]);
    const { rows, errors } = build(parsed.records);
    expect(errors).toEqual([]);
    const issues = validateBulkImport(rows, catalog).filter((i) => i.status === "blocked");
    expect(issues).toEqual([]);
  });
});

describe("short and long descriptions in all four locales", () => {
  const cells = {
    sku: "A", name_en: "N", categoryId: "cat-1",
    short_en: "s-en", short_ptBR: "s-pt", short_es: "s-es", short_zhCN: "s-zh",
    desc_en: "d-en", desc_ptBR: "d-pt", desc_es: "d-es", desc_zhCN: "d-zh",
  };

  it("parses every locale", () => {
    const product = build([cells]).rows[0]!.pending;
    expect(product.shortDescription).toEqual({ en: "s-en", "pt-BR": "s-pt", es: "s-es", "zh-CN": "s-zh" });
    expect(product.description).toEqual({ en: "d-en", "pt-BR": "d-pt", es: "d-es", "zh-CN": "d-zh" });
  });

  it.each([["short_zh", "short_zhCN"], ["Short_ZH", "short_zhCN"], ["desc_zh", "desc_zhCN"], ["short_pt", "short_ptBR"]])(
    "accepts the alias %s",
    (alias, canonical) => {
      const parsed = sheet([["sku", "name_en", alias], ["A", "N", "value"]]);
      expect(parsed.records[0]![canonical as keyof (typeof parsed.records)[number]]).toBe("value");
    }
  );

  it("editing any of the four cells updates pending, changedFields and the POST body", () => {
    const row = build([{ sku: "A", name_en: "N", categoryId: "cat-1" }]).rows[0]!;
    for (const [key, locale] of [["shortEn", "en"], ["shortPt", "pt-BR"], ["shortEs", "es"], ["shortZh", "zh-CN"]] as const) {
      const pending = applyImportPatch(row.pending, { [key]: `v-${locale}` });
      expect(pending.shortDescription[locale]).toBe(`v-${locale}`);
      expect(getImportChangedFields(row.original, pending)).toContain("shortDescription");
      expect(JSON.parse(JSON.stringify(pending)).shortDescription[locale]).toBe(`v-${locale}`);
      // Copy, not a shared reference: the original must not see the edit.
      expect(row.pending.shortDescription[locale]).toBe("");
    }
  });

  it("partial locales warn, never block", () => {
    const partial = build([{ ...cells, short_es: "", short_zhCN: "" }]).rows;
    const issues = validateBulkImport(partial, catalog).filter((i) => i.field === "shortDescription");
    expect(issues).toHaveLength(1);
    expect(issues[0]!.status).toBe("warning");
    expect(validateBulkImport(build([cells]).rows, catalog).some((i) => i.field === "shortDescription")).toBe(false);
    expect(validateBulkImport(build([{ sku: "A", name_en: "N", categoryId: "cat-1" }]).rows, catalog).some((i) => i.field === "shortDescription")).toBe(false);
  });
});

describe("legacy sheets", () => {
  it.each(["brandId", "Brand", "brand"])("a %s column parses without error and is ignored", (header) => {
    const parsed = sheet([["sku", "name_en", header, "categoryId"], ["A", "N", "no-such-brand", "cat-1"]]);
    expect(parsed.errors).toEqual([]);
    const { rows, errors } = build(parsed.records);
    expect(errors).toEqual([]);
    expect(rows[0]!.pending).not.toHaveProperty("brandId");
    expect(validateBulkImport(rows, catalog).filter((i) => i.status === "blocked")).toEqual([]);
  });

  it("a sheet without the new columns still imports", () => {
    const { rows, errors } = build(sheet([["sku", "name_pt", "categoryId"], ["A", "x", "cat-1"]]).records);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
  });
});
