import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { CaseStudyProjectMeta } from "@/components/case-studies/CaseStudyProjectMeta";

interface CaseStudyDetailHeroProps {
  title: string;
  backLabel: string;
  clientLabel: string;
  client: string;
  industryLabel: string;
  industry: string;
  countryLabel: string;
  country: string;
}

export function CaseStudyDetailHero({
  title,
  backLabel,
  clientLabel,
  client,
  industryLabel,
  industry,
  countryLabel,
  country,
}: CaseStudyDetailHeroProps) {
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

        {/* The visible title/intro block was removed; keep the h1 for screen readers and SEO. */}
        <h1 className="sr-only">{title}</h1>

        <CaseStudyProjectMeta
          clientLabel={clientLabel}
          client={client}
          industryLabel={industryLabel}
          industry={industry}
          countryLabel={countryLabel}
          country={country}
        />
      </Container>
    </section>
  );
}
