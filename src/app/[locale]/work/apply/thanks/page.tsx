import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { ThanksContent } from "@/components/work-with-us/ThanksContent";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workWithUsPage.meta" });
  return { title: t("thanksTitle"), robots: { index: false, follow: false } };
}

export default async function TalentPoolThanksPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SiteLayout navbarSolidTone="dark">
      <ThanksContent talentPool />
    </SiteLayout>
  );
}
