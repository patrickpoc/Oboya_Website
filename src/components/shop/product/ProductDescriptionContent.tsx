"use client";

import { useMemo } from "react";
import { sanitizeRichHtml } from "@/lib/cms/sanitize-rich-html";
import { enhanceDescriptionHtmlForDisplay } from "@/lib/cms/enhance-description-html";
import { cn } from "@/lib/utils";

interface ProductDescriptionContentProps {
  html: string;
  fallbackHtml?: string;
  className?: string;
  title?: string;
}

export function ProductDescriptionContent({
  html,
  fallbackHtml = "",
  className,
  title = "Product information",
}: ProductDescriptionContentProps) {
  const content = useMemo(() => {
    const primary = sanitizeRichHtml(html);
    const resolved = primary.trim() ? primary : sanitizeRichHtml(fallbackHtml);
    return enhanceDescriptionHtmlForDisplay(resolved);
  }, [html, fallbackHtml]);

  if (!content.trim()) return null;

  return (
    <section className={cn("product-description-content", className)}>
      {title ? (
        <h2 className="font-display text-lg font-semibold text-oboya-blue-dark">{title}</h2>
      ) : null}
      <div
        className={cn(
          "prose prose-neutral max-w-none overflow-x-hidden text-oboya-blue-dark/80 prose-headings:font-display prose-headings:text-oboya-blue-dark prose-a:text-oboya-green prose-img:my-6 prose-img:h-auto prose-img:max-w-full prose-hr:my-8 [&_.product-description-image[data-align='left']]:mr-auto [&_.product-description-image[data-align='left']]:ml-0 [&_.product-description-image[data-align='center']]:mx-auto [&_.product-description-image[data-align='right']]:ml-auto [&_.product-description-image[data-align='right']]:mr-0 [&_.product-description-image]:block [&_.product-description-image]:max-w-full",
          title ? "mt-4" : ""
        )}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
}
