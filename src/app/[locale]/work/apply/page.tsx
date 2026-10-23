import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { ApplyShell } from "@/components/work-with-us/ApplyShell";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workWithUsPage.meta" });
  return { title: t("talentPoolTitle"), robots: { index: false, follow: true } };
}

export default async function TalentPoolPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SiteLayout navbarSolidTone="dark">
      <ApplyShell opening={null} />
    </SiteLayout>
  );
}
