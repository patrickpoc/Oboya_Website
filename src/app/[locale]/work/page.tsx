import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { CareersAbout } from "@/components/work-with-us/CareersAbout";
import { CareersHero } from "@/components/work-with-us/CareersHero";
import { OpeningsBoard, OpeningsList } from "@/components/work-with-us/OpeningsBoard";
import { Container } from "@/components/ui/container";
import { routing } from "@/i18n/routing";
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
      <CareersHero />
      <CareersAbout />
      <section className="relative z-10 -mt-12 pb-20 md:pb-28 lg:-mt-40" aria-labelledby="openings-title">
        <Container size="wide">
          <div className="bg-white p-5 shadow-[var(--shadow-card)] sm:p-8 lg:p-10">
            <OpeningsHeading />
            <Suspense fallback={<OpeningsList openings={openings} />}>
              <OpeningsBoard openings={openings} />
            </Suspense>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
}

async function OpeningsHeading() {
  const t = await getTranslations("workWithUsPage.board");
  return (
    <h2 id="openings-title" className="mb-6 font-display text-2xl font-bold text-oboya-blue-dark">
      {t("title")}
    </h2>
  );
}
