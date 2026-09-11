import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { SolutionsHero } from "@/components/solutions/SolutionsHero";
import { SolutionsExplorer } from "@/components/solutions/SolutionsExplorer";
import { SolutionsCta } from "@/components/solutions/SolutionsCta";

export async function SolutionsPageContent() {
  const t = await getTranslations("solutionsPage");

  return (
    <>
      <SolutionsHero
        headline={t("heroHeadline")}
        body={t("heroBody")}
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
