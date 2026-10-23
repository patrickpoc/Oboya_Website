import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { CareersAbout } from "@/components/work-with-us/CareersAbout";
import { CareersFaq } from "@/components/work-with-us/CareersFaq";
import { CareersHero } from "@/components/work-with-us/CareersHero";
import { HiringProcess } from "@/components/work-with-us/HiringProcess";
import { OpeningsBoard, OpeningsList } from "@/components/work-with-us/OpeningsBoard";
import { Container } from "@/components/ui/container";
import { routing } from "@/i18n/routing";
import { countryFacets } from "@/lib/cms/careers/public";
import { listPublicOpenings } from "@/lib/cms/server/careers-public.server";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workWithUsPage.meta" });
  const title = t("listTitle");
  const description = t("listDescription");
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/work`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/work`])),
    },
    openGraph: { title, description, url: `/${locale}/work`, type: "website" },
  };
}

export default async function WorkPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const openings = await listPublicOpenings(locale);

  return (
    <SiteLayout navbarSolidTone="dark">
      <div className="bg-oboya-soft-white">
        <CareersHero countriesCount={countryFacets(openings).length} />
        <section className="relative -mt-20 pb-16 md:-mt-36 md:pb-24" aria-labelledby="openings-title">
          <Container size="wide">
            <div className="rounded-sm bg-white p-4 shadow-[var(--shadow-card)] sm:p-8 md:p-10">
              <OpeningsHeading />
              <Suspense fallback={<OpeningsList openings={openings} />}>
                <OpeningsBoard openings={openings} />
              </Suspense>
            </div>
          </Container>
        </section>
        <CareersAbout />
        <HiringProcess />
        <CareersFaq />
      </div>
    </SiteLayout>
  );
}

async function OpeningsHeading() {
  const t = await getTranslations("workWithUsPage.board");
  return (
    <h2 id="openings-title" className="mb-6 font-display text-2xl font-semibold text-oboya-blue-dark">
      {t("title")}
    </h2>
  );
}
