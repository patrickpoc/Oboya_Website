/** Which column the instructions block describes, and how to find its copy. */
export type SpreadsheetColumnRequirement = "required" | "optional" | "atLeastOne";

/** i18n key for a column header: "Crop/Culture" -> "cropCulture", "name_ptBR" -> "name_ptBR". */
export function instructionKey(header: string): string {
  const words = header.split(/[^A-Za-z0-9_]+/).filter(Boolean);
  return words
    .map((word, index) => {
      if (index > 0) return word.charAt(0).toUpperCase() + word.slice(1);
      return word === word.toUpperCase() ? word.toLowerCase() : word.charAt(0).toLowerCase() + word.slice(1);
    })
    .join("");
}

/** Import: SKU is mandatory; at least one name locale is mandatory (see bulk-import/validate.ts). */
export const IMPORT_COLUMN_REQUIREMENT: Record<string, SpreadsheetColumnRequirement> = {
  sku: "required",
  name_en: "atLeastOne",
  name_ptBR: "atLeastOne",
  name_es: "atLeastOne",
  name_zhCN: "atLeastOne",
};

/** Update: only SKU is mandatory; blank cells keep the current value. */
export const UPDATE_COLUMN_REQUIREMENT: Record<string, SpreadsheetColumnRequirement> = {
  SKU: "required",
};
