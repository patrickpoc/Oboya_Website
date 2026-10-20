import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { ApplyShell } from "@/components/work-with-us/ApplyShell";
import { getPublicOpeningBySlug } from "@/lib/cms/server/careers-public.server";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const opening = await getPublicOpeningBySlug(slug, locale);
  const t = await getTranslations({ locale, namespace: "workWithUsPage.meta" });
  return {
    title: opening ? t("applyTitle", { title: opening.title }) : t("listTitle"),
    robots: { index: false, follow: true },
  };
}

export default async function ApplyPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const opening = await getPublicOpeningBySlug(slug, locale);
  if (!opening) notFound();

  return (
    <SiteLayout navbarSolidTone="dark">
      <ApplyShell opening={{ slug: opening.slug, title: opening.title }} />
    </SiteLayout>
  );
}
