interface CaseStudyTextBlockProps {
  label: string;
  body: string;
  className?: string;
}

function isHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function CaseStudyTextBlock({
  label,
  body,
  className,
}: CaseStudyTextBlockProps) {
  if (!body?.trim()) return null;

  return (
    <div className={className}>
      <h2 className="font-body text-sm font-semibold tracking-[0.04em] text-oboya-green">
        {label}
      </h2>
      {isHtml(body) ? (
        <div
          className="prose prose-sm mt-3 max-w-none font-body text-[0.9375rem] leading-[1.75] text-oboya-blue-dark/60 md:text-base [&_p]:mb-4 [&_p:last-child]:mb-0"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      ) : (
        <div className="mt-3 space-y-4 font-body text-[0.9375rem] leading-[1.75] text-oboya-blue-dark/60 md:text-base">
          {body
            .split(/\n\n+/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
        </div>
      )}
    </div>
  );
}
