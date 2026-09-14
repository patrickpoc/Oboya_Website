export const NO_STORE_CACHE_CONTROL =
  "private, no-store, max-age=0, must-revalidate";

export const noStoreHeaders = {
  "Cache-Control": NO_STORE_CACHE_CONTROL,
} as const;
