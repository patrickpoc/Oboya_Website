"use client";

import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { QuotePricing } from "@/lib/shop/quote-pricing";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export function CheckoutSuccessDialog({
  referenceId,
  confirmationMessage,
  pricing,
  onClose,
}: {
  referenceId: string | null;
  confirmationMessage?: string;
  pricing?: QuotePricing;
  onClose: () => void;
}) {
  const t = useTranslations("shop");

  return (
    <Dialog
      open={Boolean(referenceId)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="gap-0 rounded-2xl bg-white p-8 text-center sm:max-w-md">
        <CheckCircle2 className="mx-auto size-14 text-oboya-green" aria-hidden />
        <DialogTitle className="mt-4 font-display text-xl font-semibold text-oboya-blue-dark">
          {confirmationMessage?.trim() || t("quoteSentTitle")}
        </DialogTitle>
        <DialogDescription className="mt-3 text-sm leading-relaxed text-oboya-blue-dark/70">
          {pricing === "mixed"
            ? t("quoteSentBodyMixed")
            : pricing === "quote_only"
              ? t("quoteSentBodyQuoteOnly")
              : t("quoteSentBody")}
        </DialogDescription>
        <div className="mt-6 rounded-xl bg-oboya-soft-white px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-oboya-blue-dark/60">
            {t("quoteSentReference")}
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-wide text-oboya-blue-dark">
            {referenceId}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={buttonVariants({
            className:
              "mt-6 h-11 w-full rounded-full bg-oboya-blue text-white hover:bg-oboya-blue/90",
          })}
        >
          {t("quoteSentClose")}
        </button>
      </DialogContent>
    </Dialog>
  );
}
