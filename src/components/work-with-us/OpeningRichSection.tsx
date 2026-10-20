/** Server component: renders HTML that was sanitized on read (sanitizeRichHtml). Hidden when empty. */
export function OpeningRichSection({ id, title, html }: { id: string; title: string; html: string }) {
  if (!html.replace(/<[^>]*>/g, "").trim()) return null;
  return (
    <section aria-labelledby={id} className="py-6 first:pt-0 last:pb-0">
      <h2 id={id} className="font-display text-xl font-semibold text-oboya-blue-dark md:text-2xl">
        {title}
      </h2>
      <div
        className="rich-text-content prose prose-neutral mt-3 max-w-none text-oboya-blue-dark/80 prose-headings:font-display prose-headings:text-oboya-blue-dark prose-a:text-oboya-blue-light"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
