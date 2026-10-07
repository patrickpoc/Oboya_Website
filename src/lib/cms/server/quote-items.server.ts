import "server-only";

import type { FormSubmission } from "@/lib/cms/types";
import { readProducts } from "@/lib/cms/server/products.server";
import { getActiveVariant, resolveVariantImage } from "@/lib/shop/color-variants";

type StoredQuoteItem = {
  productId?: string;
  variantId?: string | null;
  image?: string;
  variantColor?: string | null;
};

/** Older quotes were stored without the color image; resolve it from the catalog for display. */
export async function withQuoteItemImages(item: FormSubmission): Promise<FormSubmission> {
  if (item.type !== "quote" || !Array.isArray(item.data.items)) return item;
  const items = item.data.items as StoredQuoteItem[];
  if (items.every((line) => line.image)) return item;

  const products = await readProducts({ includeDeleted: true, fields: "list", skipPurge: true });
  const byId = new Map(products.map((product) => [product.id, product]));

  return {
    ...item,
    data: {
      ...item.data,
      items: items.map((line) => {
        if (line.image) return line;
        const product = line.productId ? byId.get(line.productId) : undefined;
        if (!product) return line;
        const variant = getActiveVariant(product, line.variantId ?? null);
        return {
          ...line,
          image: resolveVariantImage(product, variant),
          variantColor: line.variantColor ?? variant?.color ?? null,
        };
      }),
    },
  };
}
