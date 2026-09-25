import sanitizeHtml from "sanitize-html";
import { sanitizeInlineStyle } from "@/lib/cms/sanitize-inline-style";
import type { LocalizedString } from "@/lib/cms/types";
import {
  ALLOWED_TAGS,
  isAllowedImageSrc,
  isAllowedLinkHref,
  postProcessSanitizedHtml,
  stripHtmlToPlainText,
} from "@/lib/cms/sanitize-rich-html.shared";

/**
 * Shared rich-HTML sanitizer for server and client.
 * Uses `sanitize-html` (Node + browser) so Next.js SSR of client components
 * never hits `DOMPurify.sanitize is not a function` under Vercel/Node.
 */

const STYLE_ATTR_TAGS = ["p", "h2", "h3", "span", "blockquote", "li", "img"] as const;

function withSanitizedStyle(attribs: Record<string, string>) {
  if (!attribs.style) return attribs;
  const next = sanitizeInlineStyle(attribs.style);
  if (!next) {
    const { style: _removed, ...rest } = attribs;
    return rest;
  }
  return { ...attribs, style: next };
}

export function sanitizeRichHtml(html: string): string {
  const input = html.trim();
  if (!input) return "";

  const purified = sanitizeHtml(input, {
    allowedTags: [...ALLOWED_TAGS],
    allowedAttributes: {
      a: ["href", "title", "target", "rel", "class"],
      img: ["src", "alt", "title", "class", "data-align", "loading", "width", "height", "style"],
      p: ["class", "style"],
      h2: ["class", "style"],
      h3: ["class", "style"],
      span: ["class", "style"],
      blockquote: ["class", "style"],
      li: ["class", "style"],
      ul: ["class"],
      ol: ["class"],
    },
    allowedStyles: {
      "*": {
        color: [
          /^#([0-9a-fA-F]{3,8})$/i,
          /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i,
          /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i,
          /^var\(--oboya-[a-z0-9-]+\)$/i,
        ],
        "font-size": [/^\d+(\.\d+)?(px|rem|em)$/],
        "text-align": [/^(left|center|right|justify)$/],
        width: [/^\d+(\.\d+)?(px|%)$/],
        height: [/^\d+(\.\d+)?(px|%)$/],
        "max-width": [/^\d+(\.\d+)?(px|%)$/],
      },
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
        attribs: withSanitizedStyle({
          ...attribs,
          alt: attribs.alt ?? "",
        }),
      }),
      ...Object.fromEntries(
        STYLE_ATTR_TAGS.filter((tag) => tag !== "img").map((tag) => [
          tag,
          (_tagName: string, attribs: Record<string, string>) => ({
            tagName: tag,
            attribs: withSanitizedStyle(attribs),
          }),
        ])
      ),
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
