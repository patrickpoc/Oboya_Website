import { getTranslations } from "next-intl/server";
import { CaseStudyDetailHero } from "@/components/case-studies/CaseStudyDetailHero";
import { CaseStudyHeroImage } from "@/components/case-studies/CaseStudyHeroImage";
import { CaseStudyPerspective } from "@/components/case-studies/CaseStudyPerspective";
import { CaseStudyStorySection } from "@/components/case-studies/CaseStudyStorySection";
import { CaseStudyTextBlock } from "@/components/case-studies/CaseStudyTextBlock";
import { pickLocalized } from "@/lib/cms/utils";
import type { CmsCaseStudy } from "@/lib/cms/repositories/case-studies-repository";

interface CaseStudyDetailPageContentProps {
  study: CmsCaseStudy;
  locale: string;
}

const FALLBACK_IMAGES = [
  "/assets/homepage/greenhouse-technology.webp",
  "/assets/homepage/asia-pacific-expansion.webp",
] as const;

function storyImage(study: CmsCaseStudy, index: number) {
  return study.images[index] || study.gallery[index] || FALLBACK_IMAGES[index] || FALLBACK_IMAGES[0];
}

export async function CaseStudyDetailPageContent({
  study,
  locale,
}: CaseStudyDetailPageContentProps) {
  const t = await getTranslations("caseStudies");
  const title = pickLocalized(study.title, locale);
  const intro = pickLocalized(study.excerpt, locale);
  const timeline = pickLocalized(study.timeline, locale);
  const challenge = pickLocalized(study.challenge, locale);
  const solution = pickLocalized(study.solution, locale);
  const implementation = pickLocalized(study.implementation, locale);
  const results = pickLocalized(study.results, locale);
  const quote = pickLocalized(
    study.testimonial?.quote ?? { en: "", "pt-BR": "", es: "", "zh-CN": "" },
    locale
  );

  return (
    <>
      <CaseStudyDetailHero
        title={title}
        intro={intro}
        backLabel={t("backToHub")}
        clientLabel={t("factClient")}
        client={study.client}
        industryLabel={t("factIndustry")}
        industry={study.industry}
        timelineLabel={t("factTimeline")}
        timeline={timeline}
      />

      <CaseStudyHeroImage src={study.coverImage} alt={title} />

      <CaseStudyStorySection
        imageSrc={storyImage(study, 0)}
        imageAlt={`${title} — ${t("challengeLabel")}`}
        imagePosition="right"
      >
        <CaseStudyTextBlock label={t("challengeLabel")} body={challenge} />
        <CaseStudyTextBlock label={t("solutionLabel")} body={solution} />
      </CaseStudyStorySection>

      <CaseStudyStorySection
        imageSrc={storyImage(study, 1)}
        imageAlt={`${title} — ${t("resultLabel")}`}
        imagePosition="left"
      >
        <CaseStudyTextBlock
          label={t("implementationLabel")}
          body={implementation}
        />
        <CaseStudyTextBlock label={t("resultLabel")} body={results} />
      </CaseStudyStorySection>

      <CaseStudyPerspective
        title={t("clientPerspective")}
        quote={quote}
        author={study.testimonial?.author ?? ""}
        company={study.testimonial?.company ?? ""}
      />
    </>
  );
}
