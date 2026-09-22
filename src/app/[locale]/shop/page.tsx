import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { ShopPageContent } from "@/components/shop/ShopPageContent";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });

  return {
    title: t("metaTitle"),
    description: t("description"),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `/${loc}/shop`])
      ),
    },
  };
}

export default async function ShopPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <SiteLayout>
      <Suspense>
        <ShopPageContent />
      </Suspense>
    </SiteLayout>
  );
}
