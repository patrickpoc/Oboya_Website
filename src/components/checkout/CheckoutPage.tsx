"use client";

import { Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { AddToQuoteDialog } from "@/components/shop/quote/AddToQuoteDialog";
import { CatalogLoading, RfqError } from "@/components/shop/states/ShopStateViews";
import { CheckoutCouponCard } from "@/components/checkout/CheckoutCouponCard";
import { CheckoutSuccessDialog } from "@/components/checkout/CheckoutSuccessDialog";
import { CheckoutLineItem } from "@/components/checkout/CheckoutLineItem";
import { CheckoutUpsell } from "@/components/checkout/CheckoutUpsell";
import { RfqDetailsForm, type RfqFormState } from "@/components/checkout/RfqDetailsForm";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useShop } from "@/contexts/ShopContext";
import { Link, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { CheckoutPageSettings } from "@/lib/cms/checkout-page/types";
import { getPrimaryOfficeByCountryCode } from "@/lib/shop/office-resolver";
import { formatShopPrice } from "@/lib/shop/format-price";
import { pickLocalizedLabel } from "@/lib/shop/localized-label";
import { useMapLocations } from "@/lib/shop/use-map-locations";

const EMPTY_FORM: RfqFormState = {
  company: "",
  contactName: "",
  email: "",
  phone: "",
  country: "",
  message: "",
  privacyAccepted: true,
  marketingOptIn: false,
};

function cmsCopy(
  locale: string,
  fallback: string,
  localized: CheckoutPageSettings["copy"]["greetingI18n"]
) {
  return pickLocalizedLabel(locale, fallback, localized);
}

export function CheckoutPage({
  settings,
  popularProductIds,
}: {
  settings: CheckoutPageSettings;
  popularProductIds: string[];
}) {
  const t = useTranslations("checkout");
  const tShop = useTranslations("shop");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const {
    catalogReady,
    countryCode,
    currency,
    shopConfig,
    getLineItems,
    estimatedTotal,
    itemCount,
    updateQuantity,
    removeItem,
    submitRfq,
    rfqStatus,
    rfqReferenceId,
    resetRfqStatus,
  } = useShop();
  const { data: mapData } = useMapLocations();
  const [form, setForm] = useState<RfqFormState>(EMPTY_FORM);

  if (!catalogReady) {
    return (
      <section className="bg-oboya-soft-white py-8 md:py-12">
        <Container size="wide">
          <CatalogLoading />
        </Container>
      </section>
    );
  }

  const lineItems = getLineItems();
  const office = countryCode
    ? getPrimaryOfficeByCountryCode(countryCode, locale, mapData ?? undefined)
    : null;
  const confirmation = pickLocalizedLabel(
    locale,
    "",
    shopConfig.rfq.confirmationI18n
  ).trim();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await submitRfq(form, office?.officeId ?? null);
      setForm(EMPTY_FORM);
    } catch {
      // rfqStatus is set in ShopContext
    }
  };

  const canSubmit = shopConfig.rfq.enabled && lineItems.length > 0 && Boolean(currency);

  return (
    <section className="bg-oboya-soft-white py-8 md:py-12">
      <Container size="wide">
        <h1 className="font-display text-3xl font-semibold text-oboya-blue-dark md:text-4xl">
          {t("title")}
        </h1>

        {!shopConfig.rfq.enabled ? (
          <p className="mt-8 text-sm text-oboya-blue-dark/70">{t("quotesDisabled")}</p>
        ) : null}

        <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">
            <section className="rounded-2xl border border-border/60 bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-oboya-blue-dark">{t("itemsTitle")}</h2>
                {lineItems.length > 0 ? (
                  <p className="text-sm text-oboya-blue-dark/60">
                    {t("itemCount", { count: lineItems.length })}
                  </p>
                ) : null}
              </div>
              {lineItems.length === 0 ? (
                <div className="py-10 text-center">
                  <h3 className="font-semibold text-oboya-blue-dark">
                    {cmsCopy(locale, t("emptyTitle"), settings.copy.emptyTitleI18n)}
                  </h3>
                  <p className="mt-2 text-sm text-oboya-blue-dark/60">
                    {cmsCopy(locale, t("emptyBody"), settings.copy.emptyBodyI18n)}
                  </p>
                  <Link
                    href="/shop"
                    className={buttonVariants({
                      className:
                        "mt-6 rounded-full bg-oboya-blue text-white hover:bg-oboya-blue/90",
                    })}
                  >
                    {t("backToShop")}
                  </Link>
                </div>
              ) : (
                lineItems.map((item) => (
                  <CheckoutLineItem
                    key={`${item.productId}-${item.variantId ?? "base"}`}
                    productId={item.productId}
                    variantId={item.variantId}
                    variantName={item.variantName}
                    quantity={item.quantity}
                    unitPrice={item.unitPrice}
                    currency={currency ?? "USD"}
                    image={item.image}
                    sku={item.sku}
                    onUpdateQuantity={(qty) =>
                      updateQuantity(item.productId, qty, item.variantId)
                    }
                    onRemove={() => removeItem(item.productId, item.variantId)}
                  />
                ))
              )}
            </section>

            {settings.sections.upsell && lineItems.length > 0 ? (
              <CheckoutUpsell popularProductIds={popularProductIds} />
            ) : null}
          </div>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
            {settings.sections.coupon ? (
              <CheckoutCouponCard
                title={cmsCopy(locale, t("couponTitle"), settings.copy.couponTitleI18n)}
                unavailable={cmsCopy(
                  locale,
                  t("couponUnavailable"),
                  settings.copy.couponUnavailableI18n
                )}
              />
            ) : null}

            <form
              className="rounded-2xl border border-border/60 bg-white p-5 shadow-[var(--shadow-card)]"
              onSubmit={(event) => void handleSubmit(event)}
            >
              <h2 className="font-semibold text-oboya-blue-dark">{t("summaryTitle")}</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-oboya-blue-dark/70">
                    {t("subtotal", { count: itemCount })}
                  </dt>
                  <dd className="font-medium text-oboya-blue-dark">
                    {currency ? formatShopPrice(estimatedTotal, currency) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-oboya-blue-dark/70">{t("discounts")}</dt>
                  <dd className="text-oboya-blue-dark/50">—</dd>
                </div>
              </dl>
              <div className="mt-4 flex items-end justify-between border-t border-border/60 pt-4">
                <p className="font-semibold text-oboya-blue-dark">{t("estimatedTotal")}</p>
                <p className="text-xl font-semibold text-oboya-green">
                  {currency ? formatShopPrice(estimatedTotal, currency) : "—"}
                </p>
              </div>
              <p className="mt-1 text-xs text-oboya-blue-dark/50">{t("totalNote")}</p>

              {rfqStatus === "error" ? (
                <div className="mt-4">
                  <RfqError onRetry={resetRfqStatus} />
                </div>
              ) : null}

              {canSubmit ? <RfqDetailsForm form={form} onChange={setForm} /> : null}

              <button
                type="submit"
                disabled={!canSubmit || rfqStatus === "submitting"}
                className={buttonVariants({
                  className:
                    "mt-4 h-12 w-full rounded-lg bg-oboya-blue text-white hover:bg-oboya-blue/90",
                })}
              >
                {rfqStatus === "submitting" ? t("submitting") : t("requestQuotation")}
              </button>
              <Link
                href="/shop"
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "mt-3 h-12 w-full rounded-lg border-oboya-green text-oboya-green hover:bg-oboya-green/10 hover:text-oboya-green",
                })}
              >
                {t("continueShopping")}
              </Link>
              {settings.sections.trust ? (
                <p className="mt-4 flex items-start gap-2 text-xs text-oboya-blue-dark/60">
                  <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>{cmsCopy(locale, t("trust"), settings.copy.trustI18n)}</span>
                </p>
              ) : null}
            </form>
          </aside>
        </div>
      </Container>
      <AddToQuoteDialog />
      <CheckoutSuccessDialog
        referenceId={rfqStatus === "success" ? rfqReferenceId : null}
        confirmationMessage={confirmation || undefined}
        onClose={() => {
          resetRfqStatus();
          router.push("/shop");
        }}
      />
    </section>
  );
}
