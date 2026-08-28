import type { CmsLocale, LocalizedString } from "@/lib/cms/types";

export const PRODUCT_DESCRIPTION_HTML_MAX_BYTES = 100 * 1024;
export const PRODUCT_DESCRIPTION_MAX_IMAGES = 20;

export const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "hr",
  "blockquote",
] as const;

export const ALLOWED_ATTR = [
  "href",
  "src",
  "alt",
  "title",
  "class",
  "data-align",
  "loading",
  "target",
  "rel",
] as const;

export function isAllowedImageSrc(src: string) {
  const value = src.trim();
  if (!value) return false;
  if (value.startsWith("/uploads/") || value.startsWith("/assets/")) return true;
  if (value.startsWith("https://") || value.startsWith("http://")) {
    try {
      const url = new URL(value);
      if (url.pathname.startsWith("/storage/v1/object/public/cms-media/")) return true;
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host;
        if (url.host === supabaseHost) return true;
      }
    } catch {
      return false;
    }
  }
  return false;
}

export function isAllowedLinkHref(href: string) {
  const value = href.trim();
  if (!value) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (value.startsWith("https://") || value.startsWith("http://")) return true;
  if (value.startsWith("mailto:")) return true;
  return false;
}

export function postProcessSanitizedHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

export function stripHtmlToPlainText(html: string): string {
  if (!html.trim()) return "";
  return postProcessSanitizedHtml(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function countImagesInHtml(html: string): number {
  if (!html.trim()) return 0;
  const matches = html.match(/<img\b/gi);
  return matches?.length ?? 0;
}

export function validateProductDescriptionHtml(html: string, label = "Description") {
  if (!html.trim()) return;
  const bytes = new TextEncoder().encode(html).length;
  if (bytes > PRODUCT_DESCRIPTION_HTML_MAX_BYTES) {
    throw new Error(`${label} exceeds the maximum size (${PRODUCT_DESCRIPTION_HTML_MAX_BYTES} bytes).`);
  }
  const imageCount = countImagesInHtml(html);
  if (imageCount > PRODUCT_DESCRIPTION_MAX_IMAGES) {
    throw new Error(`${label} has too many images (max ${PRODUCT_DESCRIPTION_MAX_IMAGES}).`);
  }
}

export function validateProductDescriptions(description: LocalizedString) {
  (Object.keys(description) as CmsLocale[]).forEach((locale) => {
    validateProductDescriptionHtml(description[locale] ?? "", `Description (${locale})`);
  });
}
