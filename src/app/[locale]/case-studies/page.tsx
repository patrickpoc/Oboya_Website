import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { CaseStudiesPageContent } from "@/components/case-studies/CaseStudiesPageContent";
import { readCaseStudies } from "@/lib/cms/readers";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "caseStudies" });

  return {
    title: t("metaTitle"),
    description: t("description"),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `/${loc}/case-studies`])
      ),
    },
  };
}

export default async function CaseStudiesIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const studies = await readCaseStudies();

  return (
    <SiteLayout>
      <CaseStudiesPageContent studies={studies} locale={locale} />
    </SiteLayout>
  );
}
