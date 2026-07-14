import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/layouts/Navbar";
import { Footer } from "@/components/layouts/Footer";
import { TimelineClient } from "@/components/timeline/TimelineClient";
import { AboutPageContent } from "@/components/about/AboutPageContent";
import { AboutScrollRefresh } from "@/components/about/AboutScrollRefresh";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutV2" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AboutV2Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("aboutV2");

  return (
    <>
      <Navbar variant="storytelling" storyExitId="about-continue" />
      <main>
        <TimelineClient
          labels={{
            prev: t("prev"),
            next: t("next"),
            year: t("year"),
            progressLabel: t("progressLabel"),
            sectionLabel: t("sectionLabel"),
            discover: t("discover"),
            skip: t("skip"),
          }}
        />

        <div id="about-continue" className="relative bg-white">
          <AboutScrollRefresh />
          <AboutPageContent locale={locale} mode="afterTimeline" />
        </div>
      </main>
      <Footer />
    </>
  );
}
