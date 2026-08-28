/** Shared, isomorphic helpers (no HTML sanitization — use .client or .server for that). */
export {
  PRODUCT_DESCRIPTION_HTML_MAX_BYTES,
  PRODUCT_DESCRIPTION_MAX_IMAGES,
  stripHtmlToPlainText,
  countImagesInHtml,
  validateProductDescriptionHtml,
  validateProductDescriptions,
} from "@/lib/cms/sanitize-rich-html.shared";
