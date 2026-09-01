import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { SolutionCategoryBlockReveal } from "@/components/solutions/SolutionCategoryBlockReveal";
import { SolutionsCta } from "@/components/solutions/SolutionsCta";
import { SolutionsHero } from "@/components/solutions/SolutionsHero";
import { readHomepageSettings } from "@/lib/cms/readers";
import { pickLocalized } from "@/lib/cms/utils";
import {
  type SolutionCategoryId,
  stagesForCategory,
} from "@/lib/solutions/category-stages";

const FALLBACK_IMAGE = "/assets/homepage/greenhouse-technology.webp";

interface SolutionCategoryPageContentProps {
  categoryId: SolutionCategoryId;
  locale: string;
}

export async function SolutionCategoryPageContent({
  categoryId,
  locale,
}: SolutionCategoryPageContentProps) {
  const t = await getTranslations("solutionsPage");
  const homepage = await readHomepageSettings();
  const item = homepage.businessSolutions.items.find(
    (entry) => entry.id === categoryId
  );

  const title = t(`categories.${categoryId}.title`);
  const description =
    (item ? pickLocalized(item.description, locale) : "") ||
    t(`categories.${categoryId}.description`);
  const challenges = t.raw(`blocks.${categoryId}.challenges`) as string[];
  const stageMetas = stagesForCategory(categoryId);
  const stages = stageMetas.map((stage) => ({
    id: stage.id,
    title: t(`cards.${stage.id}.title`),
    href: stage.href,
  }));

  return (
    <>
      <SolutionsHero
        variant="category"
        title={title}
        images={[item?.image || FALLBACK_IMAGE]}
      />

      <section
        aria-label={title}
        className="overflow-x-clip bg-white pb-[var(--section-y)] pt-[var(--section-y)]"
      >
        <Container>
          <Link
            href="/solutions"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-oboya-blue-dark/70 transition-colors hover:text-oboya-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/60 focus-visible:ring-offset-2 md:mb-10"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t("backToSolutions")}
          </Link>

          <div className="mx-auto w-full min-w-0 lg:w-[90%]">
            <SolutionCategoryBlockReveal
              id={categoryId}
              title={title}
              description={description}
              challengesLabel={t("challengesLabel")}
              challenges={challenges}
              stagesLabel={t("stagesLabel")}
              stages={stages}
              primaryCta={{
                label: t("links.requestQuote"),
                href: "/contact",
              }}
              secondaryLinks={[
                {
                  label: t("links.featuredCaseStudy"),
                  href: "/case-studies",
                },
                {
                  label: t("links.relatedInsights"),
                  href: "/news",
                },
              ]}
              imageSrc={item?.image || FALLBACK_IMAGE}
              imageAlt={title}
              imagePosition="left"
              showTitle={false}
            />
          </div>
        </Container>
      </section>

      <SolutionsCta
        title={t("ctaTitle")}
        description={t("ctaDescription")}
        buttonLabel={t("ctaButton")}
        imageSrc="/assets/homepage/solutions-integrated.jpg"
      />
    </>
  );
}
