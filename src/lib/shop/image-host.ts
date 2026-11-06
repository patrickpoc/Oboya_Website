/** Mirrors `images.remotePatterns` in next.config.ts. Keep the two in step. */
const STORAGE_PATH = "/storage/v1/object/public/";

function supabaseHost(): string | null {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : null;
  } catch {
    return null;
  }
}

/** True when `next/image` may load this src; false means it needs `unoptimized`. */
export function isAllowlistedImageSrc(src: string): boolean {
  const value = (src ?? "").trim();
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (value.startsWith("data:") || value.startsWith("blob:")) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.hostname === "images.unsplash.com") return true;
  if (!url.pathname.startsWith(STORAGE_PATH)) return false;
  const host = supabaseHost();
  if (host) return url.hostname === host;
  return process.env.NODE_ENV === "development" && url.hostname.endsWith(".supabase.co");
}

/** Spread-ready prop: `unoptimized` only for hosts the optimizer will not accept. */
export function needsUnoptimized(src: string): boolean {
  return !isAllowlistedImageSrc(src);
}
