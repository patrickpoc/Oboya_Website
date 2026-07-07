export const CATALOGUE_PDF_PATH =
  "/assets/catalogue/oboya-horticulture-catalogue-2024.pdf";

export const CATALOGUE_PDF_WORKER_PATH =
  "/assets/catalogue/pdf.worker.min.mjs";

export const CATALOGUE_THUMBNAIL_MAX_WIDTH = 72;
export const CATALOGUE_THUMBNAIL_MIN_WIDTH = 48;
export const CATALOGUE_THUMBNAIL_PAGE_RATIO = 0.075;

export const CATALOGUE_PAGE_MAX_WIDTH = 960;

export function getCataloguePageWidth(containerWidth: number): number {
  if (containerWidth <= 0) return 0;
  return Math.min(containerWidth, CATALOGUE_PAGE_MAX_WIDTH);
}

export function getCatalogueThumbnailWidth(pageWidth: number): number {
  if (pageWidth <= 0) return CATALOGUE_THUMBNAIL_MIN_WIDTH;

  return Math.min(
    CATALOGUE_THUMBNAIL_MAX_WIDTH,
    Math.max(
      CATALOGUE_THUMBNAIL_MIN_WIDTH,
      pageWidth * CATALOGUE_THUMBNAIL_PAGE_RATIO
    )
  );
}
