import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { CaseStudiesHero } from "@/components/case-studies/CaseStudiesHero";
import { CaseStudiesIntro } from "@/components/case-studies/CaseStudiesIntro";
import { CaseStudyContentBlock } from "@/components/case-studies/CaseStudyContentBlock";
import { pickLocalized } from "@/lib/cms/utils";
import type { CmsCaseStudy } from "@/lib/cms/repositories/case-studies-repository";

interface CaseStudiesPageContentProps {
  studies: CmsCaseStudy[];
  locale: string;
}

const FEATURED_COUNT = 2;
const FALLBACK_COVER = "/assets/homepage/greenhouse-technology.webp";

function coverSrc(url: string) {
  if (!url) return FALLBACK_COVER;
  if (url.includes("images.unsplash.com")) {
    const base = url.split("?")[0];
    return `${base}?auto=format&fit=crop&w=1200&h=1500&q=75`;
  }
  return url;
}

export async function CaseStudiesPageContent({
  studies,
  locale,
}: CaseStudiesPageContentProps) {
  const t = await getTranslations("caseStudies");
  const published = studies.filter((s) => s.status === "published");
  const featured = published.slice(0, FEATURED_COUNT);

  return (
    <>
      <CaseStudiesHero />
      <CaseStudiesIntro />

      <section
        className="overflow-x-clip bg-white pb-[var(--section-y)]"
        aria-label={t("showcaseTitle")}
      >
        <Container>
          {featured.length === 0 ? (
            <p className="font-body text-base text-oboya-blue-dark/55">
              {t("emptyState")}
            </p>
          ) : (
            <div className="flex flex-col gap-[clamp(4.5rem,11vw,8.5rem)]">
              {featured.map((study, index) => {
                const title = pickLocalized(study.title, locale);
                const paragraphs = [
                  pickLocalized(study.challenge, locale),
                  pickLocalized(study.solution, locale),
                  pickLocalized(study.results, locale),
                ].filter(Boolean);

                return (
                  <CaseStudyContentBlock
                    key={study.id}
                    title={title}
                    paragraphs={
                      paragraphs.length > 0
                        ? paragraphs
                        : [pickLocalized(study.excerpt, locale)].filter(Boolean)
                    }
                    imageSrc={coverSrc(study.coverImage)}
                    imageAlt={title}
                    href={`/case-studies/${study.slug}`}
                    ctaLabel={t("findOutMore")}
                    imagePosition={index % 2 === 0 ? "left" : "right"}
                  />
                );
              })}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
