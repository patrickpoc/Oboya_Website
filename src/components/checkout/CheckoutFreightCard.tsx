"use client";

import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

export function CheckoutFreightCard({
  isBrazil,
  title,
  hint,
  unavailable,
}: {
  isBrazil: boolean;
  title: string;
  hint: string;
  unavailable: string;
}) {
  const t = useTranslations("checkout");

  return (
    <section className="rounded-2xl border border-border/60 bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-oboya-green/15 text-oboya-green">
            <MapPin className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold text-oboya-blue">{title}</h2>
            <p className="mt-1 text-sm text-oboya-blue-dark/60">{hint}</p>
            <p className="mt-2 text-sm font-medium text-oboya-blue-dark/70">{unavailable}</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:items-end">
          <div className="flex w-full gap-2 md:w-auto">
            <label className="sr-only" htmlFor="checkout-postal">
              {isBrazil ? t("cepLabel") : t("postalLabel")}
            </label>
            <input
              id="checkout-postal"
              disabled
              placeholder={isBrazil ? "00000-000" : t("postalLabel")}
              className="h-11 w-full rounded-lg border border-border bg-oboya-soft-white px-3 text-sm text-oboya-blue-dark/50 md:w-44"
            />
            <button
              type="button"
              disabled
              className="h-11 shrink-0 rounded-lg border border-oboya-green/40 px-4 text-sm font-semibold text-oboya-green/50"
            >
              {t("calculate")}
            </button>
          </div>
          <p className="text-sm text-oboya-blue-light/70">{t("freightUnknownPostal")}</p>
        </div>
      </div>
    </section>
  );
}
