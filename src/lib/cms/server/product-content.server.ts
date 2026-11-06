import "server-only";

import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { reconcileDescriptionImages } from "@/lib/cms/product-description-images";
import {
  sanitizeLocalizedPlainText,
  sanitizeLocalizedRichHtml,
  validateProductDescriptions,
} from "@/lib/cms/sanitize-rich-html.server";

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

/** Sanitizes only; removing images is `reconcileProductImages`, after the upsert. */
export async function persistProductWithContent(product: CmsProduct) {
  return sanitizeProductContent(product);
}

/** Best-effort cleanup of description images the saved product no longer uses. */
export async function reconcileProductImages(
  previous: CmsProduct | null | undefined,
  saved: CmsProduct
) {
  if (!previous) return;
  try {
    await reconcileDescriptionImages({
      productId: saved.id,
      previous: previous.description,
      next: saved.description,
    });
  } catch (error) {
    console.error("Description image cleanup skipped:", error);
  }
}
