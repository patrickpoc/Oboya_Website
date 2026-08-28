import "server-only";

import sanitizeHtml from "sanitize-html";
import type { LocalizedString } from "@/lib/cms/types";
import {
  ALLOWED_TAGS,
  isAllowedImageSrc,
  isAllowedLinkHref,
  postProcessSanitizedHtml,
  stripHtmlToPlainText,
  validateProductDescriptions,
} from "@/lib/cms/sanitize-rich-html.shared";

export {
  PRODUCT_DESCRIPTION_HTML_MAX_BYTES,
  PRODUCT_DESCRIPTION_MAX_IMAGES,
  stripHtmlToPlainText,
  validateProductDescriptions,
} from "@/lib/cms/sanitize-rich-html.shared";

export function sanitizeRichHtml(html: string): string {
  const input = html.trim();
  if (!input) return "";

  const purified = sanitizeHtml(input, {
    allowedTags: [...ALLOWED_TAGS],
    allowedAttributes: {
      a: ["href", "title", "target", "rel", "class"],
      img: ["src", "alt", "title", "class", "data-align", "loading"],
      p: ["class"],
      h2: ["class"],
      h3: ["class"],
      blockquote: ["class"],
      li: ["class"],
      ul: ["class"],
      ol: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    exclusiveFilter: (frame) => {
      if (frame.tag === "img") {
        return !isAllowedImageSrc(frame.attribs.src ?? "");
      }
      return false;
    },
    transformTags: {
      a: (_tagName, attribs) => {
        const href = attribs.href ?? "";
        if (!isAllowedLinkHref(href)) {
          const { href: _removed, ...rest } = attribs;
          return { tagName: "a", attribs: rest };
        }
        if (href.startsWith("http")) {
          return {
            tagName: "a",
            attribs: {
              ...attribs,
              target: "_blank",
              rel: "noopener noreferrer",
            },
          };
        }
        return { tagName: "a", attribs };
      },
      img: (_tagName, attribs) => ({
        tagName: "img",
        attribs: {
          ...attribs,
          alt: attribs.alt ?? "",
        },
      }),
    },
  });

  return postProcessSanitizedHtml(purified);
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
