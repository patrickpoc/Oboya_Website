import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { SolutionsHero } from "@/components/solutions/SolutionsHero";
import { SolutionsExplorer } from "@/components/solutions/SolutionsExplorer";
import { SolutionsCta } from "@/components/solutions/SolutionsCta";
import {
  SOLUTIONS_HERO_IMAGES,
  uniqueSolutionImages,
} from "@/lib/solutions/hero-images";

export async function SolutionsPageContent() {
  const t = await getTranslations("solutionsPage");

  const heroImages = uniqueSolutionImages([...SOLUTIONS_HERO_IMAGES]);

  return (
    <>
      <SolutionsHero
        headline={t("heroHeadline")}
        tagline={t("heroTagline")}
        body={t("heroBody")}
        accent={t("heroAccent")}
        images={heroImages}
      />
      <Suspense fallback={null}>
        <SolutionsExplorer />
      </Suspense>
      <SolutionsCta
        title={t("ctaTitle")}
        description={t("ctaDescription")}
        buttonLabel={t("ctaButton")}
      />
    </>
  );
}
