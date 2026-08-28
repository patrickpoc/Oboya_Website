import "server-only";

import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { reconcileDescriptionImages } from "@/lib/cms/product-description-images";
import {
  sanitizeLocalizedPlainText,
  sanitizeLocalizedRichHtml,
  validateProductDescriptions,
} from "@/lib/cms/sanitize-rich-html";

export function sanitizeProductContent(product: CmsProduct): CmsProduct {
  const shortDescription = sanitizeLocalizedPlainText(product.shortDescription);
  const description = sanitizeLocalizedRichHtml(product.description);
  validateProductDescriptions(description);

  return {
    ...product,
    shortDescription,
    description,
  };
}

export async function persistProductWithContent(
  product: CmsProduct,
  previous?: CmsProduct | null
) {
  const sanitized = sanitizeProductContent(product);
  if (previous) {
    await reconcileDescriptionImages({
      previous: previous.description,
      next: sanitized.description,
    });
  }
  return sanitized;
}
