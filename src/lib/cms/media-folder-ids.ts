/** Canonical Media Library folder IDs. */

export const FOLDER_ROOT = "folder-root";
export const FOLDER_WEBSITE_FILES = "folder-website-files";
export const FOLDER_PRODUCTS = "folder-products";
export const FOLDER_ECOVASO_PRODUCTS = "folder-ecovaso-products";
export const FOLDER_PRODUCT_DESCRIPTIONS = "folder-product-descriptions";

/** Legacy folders whose assets should live under Website Files. */
export const LEGACY_WEBSITE_FOLDER_IDS = [
  "folder-homepage",
  "folder-about",
  "folder-solutions",
  "folder-brand",
  "folder-pdf-pages",
  "folder-uploads",
  "folder-stock",
  "folder-certs",
] as const;
