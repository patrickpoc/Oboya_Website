import DOMPurify from "isomorphic-dompurify";
import type { CmsLocale, LocalizedString } from "@/lib/cms/types";

export const PRODUCT_DESCRIPTION_HTML_MAX_BYTES = 100 * 1024;
export const PRODUCT_DESCRIPTION_MAX_IMAGES = 20;

const ALLOWED_TAGS = [
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

const ALLOWED_ATTR = [
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

function isAllowedImageSrc(src: string) {
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

function isAllowedLinkHref(href: string) {
  const value = href.trim();
  if (!value) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (value.startsWith("https://") || value.startsWith("http://")) return true;
  if (value.startsWith("mailto:")) return true;
  return false;
}

export function sanitizeRichHtml(html: string): string {
  const input = html.trim();
  if (!input) return "";

  const purified = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOWED_ATTR: [...ALLOWED_ATTR],
    ALLOW_DATA_ATTR: true,
  });

  if (typeof window === "undefined") {
    return postProcessSanitizedHtml(purified);
  }

  const template = document.createElement("template");
  template.innerHTML = purified;

  template.content.querySelectorAll("a").forEach((anchor) => {
    const href = anchor.getAttribute("href") ?? "";
    if (!isAllowedLinkHref(href)) {
      anchor.removeAttribute("href");
    } else if (href.startsWith("http")) {
      anchor.setAttribute("rel", "noopener noreferrer");
      anchor.setAttribute("target", "_blank");
    }
  });

  template.content.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") ?? "";
    if (!isAllowedImageSrc(src)) {
      img.remove();
      return;
    }
    if (!img.getAttribute("alt")) {
      img.setAttribute("alt", "");
    }
  });

  return postProcessSanitizedHtml(template.innerHTML);
}

function postProcessSanitizedHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

export function stripHtmlToPlainText(html: string): string {
  const sanitized = sanitizeRichHtml(html);
  if (!sanitized) return "";
  return sanitized
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

export function sanitizeLocalizedRichHtml(value: LocalizedString): LocalizedString {
  return {
    en: sanitizeRichHtml(value.en ?? ""),
    "pt-BR": sanitizeRichHtml(value["pt-BR"] ?? ""),
    es: sanitizeRichHtml(value.es ?? ""),
    "zh-CN": sanitizeRichHtml(value["zh-CN"] ?? ""),
  };
}

export function sanitizeLocalizedPlainText(value: LocalizedString): LocalizedString {
  return {
    en: stripHtmlToPlainText(value.en ?? ""),
    "pt-BR": stripHtmlToPlainText(value["pt-BR"] ?? ""),
    es: stripHtmlToPlainText(value.es ?? ""),
    "zh-CN": stripHtmlToPlainText(value["zh-CN"] ?? ""),
  };
}

export function validateProductDescriptions(description: LocalizedString) {
  (Object.keys(description) as CmsLocale[]).forEach((locale) => {
    validateProductDescriptionHtml(description[locale] ?? "", `Description (${locale})`);
  });
}
