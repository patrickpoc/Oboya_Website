import "server-only";

export {
  PRODUCT_DESCRIPTION_HTML_MAX_BYTES,
  PRODUCT_DESCRIPTION_MAX_IMAGES,
  stripHtmlToPlainText,
  countImagesInHtml,
  validateProductDescriptionHtml,
  validateProductDescriptions,
} from "@/lib/cms/sanitize-rich-html.shared";

export {
  sanitizeRichHtml,
  sanitizeLocalizedRichHtml,
  sanitizeLocalizedPlainText,
} from "@/lib/cms/sanitize-rich-html.server";
