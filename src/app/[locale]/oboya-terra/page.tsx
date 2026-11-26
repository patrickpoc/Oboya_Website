import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { OboyaTerraPageContent } from "@/components/oboya-terra/OboyaTerraPageContent";
import { readOboyaTerraSettings } from "@/lib/cms/readers";
import { oboyaTerraShopHref } from "@/lib/cms/repositories/oboya-terra-repository";
import { pickLocalized } from "@/lib/cms/utils";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/constants/site";

type Props = { params: Promise<{ locale: string }> };

const PATH = "oboya-terra";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "oboyaTerraPage" });
  const title = t("metaTitle");
  const description = t("heroBody").split("\n\n")[1];

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/${PATH}`,
      languages: Object.fromEntries(routing.locales.map((loc) => [loc, `/${loc}/${PATH}`])),
    },
    openGraph: { title: `${title} | ${siteConfig.name}`, description },
  };
}

export default async function OboyaTerraPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const settings = await readOboyaTerraSettings();
  const blocks = settings.blocks.map((block) => ({
    id: block.id,
    title: pickLocalized(block.title, locale),
    description: pickLocalized(block.description, locale),
    image: block.image,
    href: oboyaTerraShopHref(block.shop),
  }));

  return (
    <SiteLayout>
      <OboyaTerraPageContent blocks={blocks} exploreHref={oboyaTerraShopHref(settings.exploreShop)} />
    </SiteLayout>
  );
}
