import { setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { CaseStudiesPageContent } from "@/components/case-studies/CaseStudiesPageContent";
import { readCaseStudies } from "@/lib/cms/readers";

type Props = { params: Promise<{ locale: string }> };

export default async function CaseStudiesIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const studies = readCaseStudies();

  return (
    <SiteLayout>
      <CaseStudiesPageContent studies={studies} locale={locale} />
    </SiteLayout>
  );
}
