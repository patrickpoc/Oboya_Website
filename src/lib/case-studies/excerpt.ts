/** Splits case study excerpt into up to three display paragraphs (double-newline separated). */
export function splitCaseStudyExcerpt(text: string): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, 3);
}
