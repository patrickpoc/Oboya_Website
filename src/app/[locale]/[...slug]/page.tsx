import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { AboutPageContent } from "@/components/about/AboutPageContent";
import { ContactPageContent } from "@/components/contact/ContactPageContent";
import { FaqsPageContent } from "@/components/faqs/FaqsPageContent";
import { WorkWithUsPageContent } from "@/components/work-with-us/WorkWithUsPageContent";
import { LegalPageContent } from "@/components/legal/LegalPageContent";
import { PrivacyPageContent } from "@/components/legal/PrivacyPageContent";
import { InnerPageHero } from "@/components/sections/InnerPageHero";
import {
  getAllPageSlugs,
  getPageConfig,
  getPageSlug,
} from "@/constants/pages";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/constants/site";

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllPageSlugs().map((slug) => ({ locale, slug }))
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
  const pageSlug = getPageSlug(slug);

  const title = t(`${config.messageKey}.title`);
  const eyebrow = t(`${config.messageKey}.eyebrow`);

  const description =
    config.template === "about"
      ? t("about.description")
      : config.template === "faqs"
        ? t("faqs.description")
        : config.template === "workWithUs"
          ? t("workWithUs.description")
          : pageSlug === "privacy"
            ? t("privacy.description")
            : t("terms.description");

  if (config.template === "about") {
    return (
      <SiteLayout>
        <AboutPageContent locale={locale} />
      </SiteLayout>
    );
  }

  if (config.template === "contact") {
    return (
      <SiteLayout>
        <ContactPageContent />
      </SiteLayout>
    );
  }

  if (config.template === "faqs") {
    return (
      <SiteLayout>
        <FaqsPageContent locale={locale} />
      </SiteLayout>
    );
  }

  if (config.template === "legal") {
    return (
      <SiteLayout>
        {pageSlug === "privacy" ? (
          <PrivacyPageContent locale={locale} />
        ) : (
          <LegalPageContent />
        )}
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <InnerPageHero eyebrow={eyebrow} title={title} description={description} />
      <WorkWithUsPageContent />
    </SiteLayout>
  );
}
