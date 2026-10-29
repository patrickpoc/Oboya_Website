import { describe, expect, it } from "vitest";
import { parseImportSpreadsheetBuffer } from "../parse-spreadsheet";

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
