import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { CaseStudyProjectMeta } from "@/components/case-studies/CaseStudyProjectMeta";
import { splitCaseStudyExcerpt } from "@/lib/case-studies/excerpt";

interface CaseStudyDetailHeroProps {
  title: string;
  intro: string;
  backLabel: string;
  clientLabel: string;
  client: string;
  industryLabel: string;
  industry: string;
  timelineLabel: string;
  timeline: string;
}

export function CaseStudyDetailHero({
  title,
  intro,
  backLabel,
  clientLabel,
  client,
  industryLabel,
  industry,
  timelineLabel,
  timeline,
}: CaseStudyDetailHeroProps) {
  const introParagraphs = splitCaseStudyExcerpt(intro);

  return (
    <section className="bg-white pt-[clamp(3.5rem,8vw,5.5rem)] pb-[clamp(2.5rem,5vw,3.5rem)]">
      <Container>
        <Link
          href="/case-studies"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-oboya-blue-dark/70 transition-colors hover:text-oboya-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/60 focus-visible:ring-offset-2 md:mb-10"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {backLabel}
        </Link>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[1.05] tracking-[-0.03em] text-oboya-blue-dark text-pretty lg:col-span-6">
            {title}
          </h1>
          {introParagraphs.length > 0 ? (
            <div className="flex max-w-md flex-col gap-4 font-body text-[0.9375rem] leading-[1.75] text-oboya-blue-dark/55 md:text-base lg:col-span-5 lg:col-start-8 lg:pt-3">
              {introParagraphs.map((paragraph, index) => (
                <p key={index} className="line-clamp-5">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}
        </div>

        <CaseStudyProjectMeta
          clientLabel={clientLabel}
          client={client}
          industryLabel={industryLabel}
          industry={industry}
          timelineLabel={timelineLabel}
          timeline={timeline}
        />
      </Container>
    </section>
  );
}
