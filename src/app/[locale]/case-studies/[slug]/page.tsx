import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { CaseStudyDetailPageContent } from "@/components/case-studies/CaseStudyDetailPageContent";
import { readCaseStudies, readCaseStudyBySlug } from "@/lib/cms/readers";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const studies = await readCaseStudies();
  return routing.locales.flatMap((locale) =>
    studies.map((item) => ({ locale, slug: item.slug }))
  );
}

export default async function CaseStudyDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const study = await readCaseStudyBySlug(slug);
  if (!study) notFound();

  return (
    <SiteLayout navbarSolidTone="dark">
      <CaseStudyDetailPageContent study={study} locale={locale} />
    </SiteLayout>
  );
}
