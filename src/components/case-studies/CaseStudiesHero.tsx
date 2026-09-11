import { getTranslations } from "next-intl/server";
import { PageIntroBanner } from "@/components/ui/PageIntroBanner";

export async function CaseStudiesHero() {
  const t = await getTranslations("caseStudies");

  return (
    <PageIntroBanner title={t("heroEyebrow")} body={t("heroTitle")} />
  );
}
