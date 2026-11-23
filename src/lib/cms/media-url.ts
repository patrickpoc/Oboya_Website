/**
 * Accepts only images next/image can render: local /uploads or /assets, or https
 * on the configured Supabase host under /storage/v1/object/public/. Else "".
 */
export function sanitizeSiteImageUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const v = value.trim();
  if (!v || /[\\\s]/.test(v)) return "";
  if (v.startsWith("/")) {
    if (/[?#]/.test(v) || !isSafeImagePath(v)) return "";
    return v.startsWith("/uploads/") || v.startsWith("/assets/") ? v : "";
  }
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return "";
  try {
    const url = new URL(v);
    if (
      url.protocol !== "https:" ||
      url.host !== new URL(raw).host ||
      url.username ||
      url.password ||
      !url.pathname.startsWith("/storage/v1/object/public/") ||
      !isSafeImagePath(url.pathname)
    )
      return "";
    return url.origin + url.pathname;
  } catch {
    return "";
  }
}

/** Decodes up to 3 times, then rejects traversal, doubled slashes, backslashes, control chars and non-raster extensions. */
function isSafeImagePath(path: string): boolean {
  let d = path;
  try {
    for (let i = 0; i < 3; i++) d = decodeURIComponent(d);
  } catch {
    return false;
  }
  if (d.includes("..") || d.includes("//") || /[\\\u0000-\u001f\u007f]/.test(d)) return false;
  return /\.(jpe?g|png|webp|avif|gif)$/i.test(d);
}
