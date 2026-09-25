"use client";

/**
 * Client entry for rich-HTML sanitization.
 * Uses the shared `sanitize-html` implementation so SSR of client components
 * works on Vercel (plain `dompurify` has no `.sanitize` under Node).
 */
export { sanitizeRichHtml } from "@/lib/cms/sanitize-rich-html.core";
