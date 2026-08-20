import { Container } from "@/components/ui/container";
import { CaseStudyProjectMeta } from "@/components/case-studies/CaseStudyProjectMeta";

interface CaseStudyDetailHeroProps {
  title: string;
  intro: string;
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
  clientLabel,
  client,
  industryLabel,
  industry,
  timelineLabel,
  timeline,
}: CaseStudyDetailHeroProps) {
  return (
    <section className="bg-white pt-[clamp(3.5rem,8vw,5.5rem)] pb-[clamp(2.5rem,5vw,3.5rem)]">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[1.05] tracking-[-0.03em] text-oboya-blue-dark text-pretty lg:col-span-6">
            {title}
          </h1>
          {intro ? (
            <p className="max-w-md font-body text-[0.9375rem] leading-[1.75] text-oboya-blue-dark/55 md:text-base lg:col-span-5 lg:col-start-8 lg:pt-3">
              {intro}
            </p>
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
