import type { MediaAsset, MediaAssetVariants } from "@/lib/cms/types";

/**
 * Resolve responsive sources for a CMS image URL.
 * Looks up variants from a media asset list when available.
 */
export function findMediaAssetByUrl(
  assets: MediaAsset[],
  url: string
): MediaAsset | undefined {
  if (!url) return undefined;
  return assets.find(
    (asset) =>
      asset.url === url ||
      asset.originalUrl === url ||
      Object.values(asset.variants ?? {}).some((v) => v?.url === url)
  );
}

export function getCmsImageSources(
  url: string,
  variants?: MediaAssetVariants | null
) {
  const v = variants ?? {};
  const desktopWebp = v.desktop?.url ?? url;
  const mobileWebp = v.mobile?.url ?? v.desktop?.url ?? url;
  const desktopAvif = v.desktopAvif?.url;
  const mobileAvif = v.mobileAvif?.url;
  const desktopJpeg = v.desktopJpeg?.url ?? url;
  const width = v.desktop?.width ?? v.mobile?.width ?? v.thumb?.width;
  const height = v.desktop?.height ?? v.mobile?.height ?? v.thumb?.height;

  return {
    url: desktopWebp,
    mobileWebp,
    desktopWebp,
    mobileAvif,
    desktopAvif,
    desktopJpeg,
    width,
    height,
    hasVariants: Boolean(v.desktop || v.mobile),
  };
}
