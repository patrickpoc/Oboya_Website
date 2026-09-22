export const BULK_FIELD_LABELS: Record<string, string> = {
  moq: "MOQ",
  categoryId: "Category",
  subcategoryId: "Subcategory",
  brandId: "Brand",
  application: "Application",
  cultures: "Crop / Culture",
  certifications: "Certifications",
  countryOfOrigin: "Country of manufacture",
  enabledCountries: "Market availability",
  status: "Available in Shop",
  product: "Product",
};

/** Spreadsheet column headers (canonical). */
export const BULK_SPREADSHEET_HEADERS = [
  "SKU",
  "MOQ",
  "Category",
  "Subcategory",
  "Brand",
  "Application",
  "Crop/Culture",
  "Certifications",
  "Country of manufacture",
  "Market availability",
  "Available in Shop",
] as const;

export type BulkSpreadsheetHeader = (typeof BULK_SPREADSHEET_HEADERS)[number];

/** Map various header aliases → canonical header. */
export const SPREADSHEET_HEADER_ALIASES: Record<string, BulkSpreadsheetHeader> = {
  sku: "SKU",
  moq: "MOQ",
  category: "Category",
  categoryid: "Category",
  subcategory: "Subcategory",
  subcategoryid: "Subcategory",
  brand: "Brand",
  brandid: "Brand",
  application: "Application",
  applications: "Application",
  "crop/culture": "Crop/Culture",
  crop: "Crop/Culture",
  culture: "Crop/Culture",
  cultures: "Crop/Culture",
  certifications: "Certifications",
  certification: "Certifications",
  "country of manufacture": "Country of manufacture",
  countryoforigin: "Country of manufacture",
  country: "Country of manufacture",
  "market availability": "Market availability",
  markets: "Market availability",
  enabledcountries: "Market availability",
  "available in shop": "Available in Shop",
  shop: "Available in Shop",
  status: "Available in Shop",
};
