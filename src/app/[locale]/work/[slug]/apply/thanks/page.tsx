import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { ThanksContent } from "@/components/work-with-us/ThanksContent";
import { getPublicOpeningBySlug } from "@/lib/cms/server/careers-public.server";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workWithUsPage.meta" });
  return { title: t("thanksTitle"), robots: { index: false, follow: false } };
}

export default async function ApplyThanksPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const opening = await getPublicOpeningBySlug(slug, locale);
  return (
    <SiteLayout navbarSolidTone="dark">
      <ThanksContent openingTitle={opening?.title ?? null} />
    </SiteLayout>
  );
}
