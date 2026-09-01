import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { SolutionsPageContent } from "@/components/solutions/SolutionsPageContent";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/constants/site";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "solutionsPage" });
  const title = t("metaTitle");

  return {
    title,
    description: t("heroBody"),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `/${loc}/solutions`])
      ),
    },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description: t("heroHeadline"),
    },
  };
}

export default async function SolutionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <SiteLayout>
      <Suspense fallback={null}>
        <SolutionsPageContent />
      </Suspense>
    </SiteLayout>
  );
}
