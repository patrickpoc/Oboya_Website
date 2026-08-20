import { Container } from "@/components/ui/container";

interface CaseStudyPerspectiveProps {
  title: string;
  quote: string;
  author: string;
  company: string;
}

export function CaseStudyPerspective({
  title,
  quote,
  author,
  company,
}: CaseStudyPerspectiveProps) {
  if (!quote?.trim()) return null;

  return (
    <section className="bg-white py-[var(--section-y)]">
      <Container>
        <h2 className="text-center font-display text-[clamp(2rem,4.5vw,3.5rem)] font-light tracking-[-0.02em] text-oboya-blue-dark">
          {title}
        </h2>

        <figure className="relative mx-auto mt-10 max-w-4xl bg-oboya-blue px-8 py-10 shadow-[0_18px_50px_-28px_rgba(1,32,63,0.55)] md:mt-14 md:px-14 md:py-14">
          <span
            aria-hidden
            className="pointer-events-none absolute top-6 left-6 font-display text-[4.5rem] leading-none text-oboya-blue-light/70 md:top-8 md:left-10 md:text-[6rem]"
          >
            “
          </span>
          <blockquote className="relative pt-10 md:pt-12">
            <p className="font-body text-base leading-[1.75] text-white/95 italic md:text-lg md:leading-[1.8]">
              {quote}
            </p>
          </blockquote>
          <figcaption className="relative mt-8 space-y-1 md:mt-10">
            {author ? (
              <p className="font-body text-xs font-semibold tracking-[0.14em] text-white uppercase">
                {author}
              </p>
            ) : null}
            {company ? (
              <p className="font-body text-xs font-medium tracking-[0.12em] text-white/75 uppercase">
                {company}
              </p>
            ) : null}
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}
