import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { routing } from "@/i18n/routing";
import { DEFAULT_CHECKOUT_PAGE } from "@/lib/cms/checkout-page/defaults";
import { readCheckoutPage } from "@/lib/cms/server/checkout-page.server";
import { readPopularQuoteProductIds } from "@/lib/shop/checkout/popular-products.server";
import { pickLocalizedLabel } from "@/lib/shop/localized-label";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  const settings = await readCheckoutPage().catch(() => null);
  const title = settings
    ? pickLocalizedLabel(locale, t("metaTitle"), settings.seo.titleI18n)
    : t("metaTitle");
  const description = settings
    ? pickLocalizedLabel(locale, t("metaDescription"), settings.seo.descriptionI18n)
    : t("metaDescription");

  return {
    title,
    description,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `/${loc}/checkout`])
      ),
    },
  };
}

export default async function CheckoutRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [settings, popularProductIds] = await Promise.all([
    readCheckoutPage().catch(() => DEFAULT_CHECKOUT_PAGE),
    readPopularQuoteProductIds().catch(() => [] as string[]),
  ]);

  return (
    <SiteLayout>
      <Suspense fallback={null}>
        <CheckoutPage settings={settings} popularProductIds={popularProductIds} />
      </Suspense>
    </SiteLayout>
  );
}
