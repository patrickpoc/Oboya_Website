import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { CaseStudyDetailPageContent } from "@/components/case-studies/CaseStudyDetailPageContent";
import { readCaseStudies, readCaseStudyBySlug } from "@/lib/cms/readers";
import { pickLocalized } from "@/lib/cms/utils";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const studies = await readCaseStudies();
  return routing.locales.flatMap((locale) =>
    studies.map((item) => ({ locale, slug: item.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const study = await readCaseStudyBySlug(slug);
  if (!study) return { title: "Not Found" };

  const t = await getTranslations({ locale, namespace: "caseStudies" });
  const seoTitle = pickLocalized(study.seo.title, locale);
  const title = pickLocalized(study.title, locale);
  const seoDescription = pickLocalized(study.seo.description, locale);
  const excerpt = pickLocalized(study.excerpt, locale);

  return {
    title: seoTitle || title || t("metaTitle"),
    description: seoDescription || excerpt || t("description"),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `/${loc}/case-studies/${slug}`])
      ),
    },
  };
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
