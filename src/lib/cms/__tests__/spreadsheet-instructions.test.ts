import { describe, expect, it } from "vitest";
import en from "../../../../messages/en/admin.json";
import { IMPORT_SPREADSHEET_HEADERS } from "../bulk-import/parse-spreadsheet";
import { BULK_SPREADSHEET_HEADERS } from "../bulk-update/field-labels";
import {
  IMPORT_COLUMN_REQUIREMENT,
  instructionKey,
  UPDATE_COLUMN_REQUIREMENT,
} from "../spreadsheet-instructions";

type Instructions = { columns: Record<string, { meaning?: string; example?: string }> };
const importCopy = en.products.bulkImport.instructions as unknown as Instructions;
const updateCopy = en.products.bulk.instructions as unknown as Instructions;

describe.each([
  ["import", IMPORT_SPREADSHEET_HEADERS, importCopy, IMPORT_COLUMN_REQUIREMENT],
  ["update", BULK_SPREADSHEET_HEADERS, updateCopy, UPDATE_COLUMN_REQUIREMENT],
] as const)("%s spreadsheet instructions", (_name, headers, copy, requirements) => {
  it.each([...headers])("has meaning and example for %s", (header) => {
    const column = copy.columns[instructionKey(header)];
    expect(column?.meaning?.trim()).toBeTruthy();
    expect(column?.example?.trim()).toBeTruthy();
  });

  it("has no copy for columns that no longer exist", () => {
    const keys = new Set(headers.map(instructionKey));
    expect(Object.keys(copy.columns).filter((key) => !keys.has(key))).toEqual([]);
  });

  it("only marks real headers in requirements", () => {
    for (const header of Object.keys(requirements)) {
      expect(headers as readonly string[]).toContain(header);
    }
  });
});
