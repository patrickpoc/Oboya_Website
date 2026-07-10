import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/layouts/Navbar";
import { TimelineClient } from "@/components/timeline/TimelineClient";

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
      <Navbar transparent persistTransparent />
      <main>
        <TimelineClient
          labels={{
            prev: t("prev"),
            next: t("next"),
            year: t("year"),
            progressLabel: t("progressLabel"),
            sectionLabel: t("sectionLabel"),
            discover: t("discover"),
          }}
        />
      </main>
    </>
  );
}
