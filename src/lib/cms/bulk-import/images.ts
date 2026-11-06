import { normalizeImageColorIds } from "@/lib/shop/color-variants";

export const MAX_IMAGE_URL_LENGTH = 2048;
const OWN_STORAGE_PATH = "/storage/v1/object/public/cms-media/";

/** Drops blank slots; an image-less product keeps the editor's single empty slot. */
export function compactImages(images: readonly string[] | undefined): string[] {
  const list = (images ?? []).map((url) => url?.trim() ?? "").filter(Boolean);
  return list.length > 0 ? list : [""];
}

/** `images` and `imageColorIds` always have the same length (one color list per image). */
export function withAlignedImages(
  images: readonly string[] | undefined,
  imageColorIds: unknown
): { images: string[]; imageColorIds: string[][] } {
  const list = compactImages(images);
  return { images: list, imageColorIds: normalizeImageColorIds(imageColorIds, list.length) };
}

/** Message for an unusable image URL, or null when it is acceptable (https URL or site-relative path). */
export function imageUrlProblem(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  if (url.length > MAX_IMAGE_URL_LENGTH) return "Image URL is too long.";
  if (url.startsWith("/")) {
    return url.startsWith("//") || url.includes("\\") ? "Image path is not valid." : null;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "Image URL is not valid. Use an https:// link or pick from the media library.";
  }
  if (parsed.protocol === "http:") return "Image URL must use https://.";
  if (parsed.protocol !== "https:") return "Image URL must be an https:// link.";
  if (parsed.username || parsed.password) return "Image URL must not contain credentials.";
  return null;
}

/** True for our own Supabase public media bucket: same host, bucket path, https. */
function isOwnStorageUrl(url: URL): boolean {
  if (url.protocol !== "https:" || !url.pathname.startsWith(OWN_STORAGE_PATH)) return false;
  let own = "";
  try {
    own = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : "";
  } catch {
    own = "";
  }
  return own ? url.hostname === own : url.hostname.endsWith(".supabase.co");
}

/** A http(s) URL that is not already in our media storage and so must be copied during import. */
export function isExternalImageUrl(raw: string): boolean {
  const url = raw.trim();
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    return !isOwnStorageUrl(new URL(url));
  } catch {
    return true;
  }
}
