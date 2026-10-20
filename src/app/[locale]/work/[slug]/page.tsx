import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { OpeningDetail } from "@/components/work-with-us/OpeningDetail";
import { routing } from "@/i18n/routing";
import { getPublicOpeningBySlug, listPublicOpenings } from "@/lib/cms/server/careers-public.server";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const openings = await listPublicOpenings("en");
  return routing.locales.flatMap((locale) => openings.map((o) => ({ locale, slug: o.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const opening = await getPublicOpeningBySlug(slug, locale);
  if (!opening) {
    const t = await getTranslations({ locale, namespace: "workWithUsPage.detail.notFound" });
    return { title: t("title"), robots: { index: false } };
  }
  const description = opening.summary || (await getTranslations({ locale, namespace: "workWithUsPage.meta" }))("listDescription");
  return {
    title: opening.title,
    description,
    alternates: {
      canonical: `/${locale}/work/${slug}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/work/${slug}`])),
    },
    openGraph: { title: opening.title, description, url: `/${locale}/work/${slug}`, type: "website" },
  };
}

export default async function OpeningPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [opening, all] = await Promise.all([getPublicOpeningBySlug(slug, locale), listPublicOpenings(locale)]);
  if (!opening) notFound();

  return (
    <SiteLayout navbarSolidTone="dark">
      <OpeningDetail opening={opening} all={all} />
    </SiteLayout>
  );
}
