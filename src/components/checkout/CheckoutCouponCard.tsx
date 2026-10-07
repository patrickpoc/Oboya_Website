"use client";

import { useTranslations } from "next-intl";

export function CheckoutCouponCard({
  title,
  unavailable,
}: {
  title: string;
  unavailable: string;
}) {
  const t = useTranslations("checkout");

  return (
    <section className="rounded-2xl border border-border/60 bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="font-semibold text-oboya-blue-dark">{title}</h2>
      <p className="mt-1 text-sm text-oboya-blue-dark/60">{unavailable}</p>
      <div className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor="checkout-coupon">
          {title}
        </label>
        <input
          id="checkout-coupon"
          disabled
          placeholder={t("couponPlaceholder")}
          className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-oboya-soft-white px-3 text-sm"
        />
        <button
          type="button"
          disabled
          className="h-11 shrink-0 rounded-lg border border-oboya-green/40 px-4 text-sm font-semibold text-oboya-green/50"
        >
          {t("apply")}
        </button>
      </div>
    </section>
  );
}
