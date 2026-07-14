import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { AboutPageContent } from "@/components/about/AboutPageContent";
import { ContactForm } from "@/components/sections/ContactForm";
import { FaqsPageContent } from "@/components/faqs/FaqsPageContent";
import { WorkWithUsPageContent } from "@/components/work-with-us/WorkWithUsPageContent";
import { LegalPageContent } from "@/components/legal/LegalPageContent";
import { InnerPageHero } from "@/components/sections/InnerPageHero";
import { LoremContent } from "@/components/sections/LoremContent";
import { PageListing } from "@/components/sections/PageListing";
import {
  getAllPageSlugs,
  getChildPages,
  getPageConfig,
  getPageSlug,
} from "@/constants/pages";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/constants/site";

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

export function generateStaticParams() {
  const slugs = getAllPageSlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const config = getPageConfig(slug);

  if (!config) {
    return { title: "Not Found" };
  }

  const t = await getTranslations({ locale, namespace: "pages" });
  const title = t(`${config.messageKey}.title`);

  return {
    title,
    description: `${title} | ${siteConfig.name}`,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `/${loc}/${slug.join("/")}`])
      ),
    },
  };
}

export default async function InnerPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const config = getPageConfig(slug);

  if (!config) {
    notFound();
  }

  const t = await getTranslations("pages");
  const tCommon = await getTranslations("common");
  const pageSlug = getPageSlug(slug);
  const children = getChildPages(pageSlug);

  const title = t(`${config.messageKey}.title`);
  const eyebrow = t(`${config.messageKey}.eyebrow`);

  const description =
    config.template === "about"
      ? t("about.description")
      : config.template === "faqs"
        ? t("faqs.description")
        : config.template === "workWithUs"
          ? t("workWithUs.description")
          : config.template === "legal"
            ? t("terms.description")
            : tCommon("loremShort");

  if (config.template === "about") {
    return (
      <SiteLayout>
        <AboutPageContent locale={locale} mode="full" />
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <InnerPageHero eyebrow={eyebrow} title={title} description={description} />
      {config.template === "contact" && <ContactForm />}
      {config.template === "faqs" && <FaqsPageContent />}
      {config.template === "workWithUs" && <WorkWithUsPageContent />}
      {config.template === "legal" && <LegalPageContent />}
      {config.template === "listing" && <PageListing items={children} />}
      {(!config.template || config.template === "default") && <LoremContent />}
    </SiteLayout>
  );
}
