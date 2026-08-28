"use client";

import DOMPurify from "dompurify";
import {
  ALLOWED_ATTR,
  ALLOWED_TAGS,
  isAllowedImageSrc,
  isAllowedLinkHref,
  postProcessSanitizedHtml,
} from "@/lib/cms/sanitize-rich-html.shared";

export function sanitizeRichHtml(html: string): string {
  const input = html.trim();
  if (!input) return "";

  const purified = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOWED_ATTR: [...ALLOWED_ATTR],
    ALLOW_DATA_ATTR: true,
  });

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
