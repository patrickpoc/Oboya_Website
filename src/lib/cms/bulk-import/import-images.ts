import { isExternalImageUrl, withAlignedImages } from "@/lib/cms/bulk-import/images";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

/** Copies one external image into the media library and returns its library URL. */
export type ImageImporter = (url: string) => Promise<string>;

export class ImageCopyError extends Error {
  constructor(
    readonly imageIndex: number,
    readonly url: string,
    message: string
  ) {
    super(`Image ${imageIndex + 1} (${url}): ${message}`);
    this.name = "ImageCopyError";
  }
}

export const importImageViaApi: ImageImporter = async (url) => {
  const response = await fetch("/api/cms/media/import-url", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-quiet": "1" },
    body: JSON.stringify({ url }),
  });
  const payload = (await response.json().catch(() => null)) as
    | { asset?: { url?: string }; error?: string }
    | null;
  if (!response.ok || !payload?.asset?.url) {
    throw new Error(payload?.error || `HTTP ${response.status}`);
  }
  return payload.asset.url;
};

/**
 * Returns the product with every external image replaced by its media-library copy.
 * Throws ImageCopyError on the first failure so the caller can skip writing the product.
 * `cache` de-duplicates the same URL across rows of one batch.
 */
export async function copyExternalImages(
  product: CmsProduct,
  importer: ImageImporter,
  cache: Map<string, Promise<string>> = new Map()
): Promise<CmsProduct> {
  const source = product.images ?? [];
  if (!source.some((url) => isExternalImageUrl(url ?? ""))) return product;

  const images: string[] = [];
  for (let index = 0; index < source.length; index += 1) {
    const url = (source[index] ?? "").trim();
    if (!isExternalImageUrl(url)) {
      images.push(url);
      continue;
    }
    let pending = cache.get(url);
    if (!pending) {
      pending = importer(url);
      cache.set(url, pending);
    }
    try {
      images.push(await pending);
    } catch (error) {
      cache.delete(url);
      throw new ImageCopyError(index, url, error instanceof Error ? error.message : "Could not copy the image.");
    }
  }
  return { ...product, ...withAlignedImages(images, product.imageColorIds) };
}
