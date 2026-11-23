import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { InnovationPageContent } from "@/components/innovation/InnovationPageContent";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/constants/site";

type Props = { params: Promise<{ locale: string }> };

const PATH = "innovation-with-purpose";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "innovationPage" });
  const title = t("metaTitle");
  const description = t("heroBody").split("\n\n")[0];

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/${PATH}`,
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `/${loc}/${PATH}`])
      ),
    },
    openGraph: { title: `${title} | ${siteConfig.name}`, description },
  };
}

export default async function InnovationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <SiteLayout>
      <InnovationPageContent />
    </SiteLayout>
  );
}
