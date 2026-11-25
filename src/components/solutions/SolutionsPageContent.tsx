import { Suspense } from "react";
import { SolutionsHero } from "@/components/solutions/SolutionsHero";
import { SolutionsExplorer } from "@/components/solutions/SolutionsExplorer";
import { SolutionsCta } from "@/components/solutions/SolutionsCta";
import { SolutionsFeatured } from "@/components/solutions/SolutionsFeatured";
import { pickLocalized } from "@/lib/cms/utils";
import { readSolutionsPageSettingsDurable } from "@/lib/cms/server/solutions-page.server";
import { readCaseStudiesDurable } from "@/lib/cms/server/case-studies.server";
import { splitCaseStudyExcerpt } from "@/lib/case-studies/excerpt";
import { getLocale, getTranslations } from "next-intl/server";

const FALLBACK_COVER = "/assets/homepage/greenhouse-technology.webp";

export async function SolutionsPageContent() {
  const locale = await getLocale();
  const settings = await readSolutionsPageSettingsDurable();
  const t = await getTranslations("solutionsPage.featured");
  const dateFmt = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  });
  const featured = (await readCaseStudiesDurable())
    .filter((s) => s.status === "published")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 2)
    .map((s) => ({
      id: s.id,
      href: `/case-studies/${s.slug}`,
      title: pickLocalized(s.title, locale),
      date: dateFmt.format(new Date(s.createdAt)),
      excerpt: splitCaseStudyExcerpt(pickLocalized(s.excerpt, locale))[0] ?? "",
      category: s.industry,
      imageSrc: s.coverImage || FALLBACK_COVER,
    }));

  return (
    <>
      <SolutionsHero
        headline={pickLocalized(settings.hero.headline, locale)}
        body={pickLocalized(settings.hero.body, locale)}
      />
      <Suspense fallback={null}>
        <SolutionsExplorer settings={settings} />
      </Suspense>
      {featured.length > 0 ? (
        <SolutionsFeatured
          title={t("title")}
          tagLabel={t("caseStudyTag")}
          readLabel={t("readArticle")}
          items={featured}
        />
      ) : null}
      <SolutionsCta
        title={pickLocalized(settings.cta.title, locale)}
        description={pickLocalized(settings.cta.description, locale)}
        buttonLabel={pickLocalized(settings.cta.buttonLabel, locale)}
        href={settings.cta.href}
        imageSrc="/assets/homepage/cta-flowers-field.jpg"
      />
    </>
  );
}
