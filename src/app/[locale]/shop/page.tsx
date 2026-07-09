import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { ShopPageContent } from "@/components/shop/ShopPageContent";

type Props = { params: Promise<{ locale: string }> };

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
