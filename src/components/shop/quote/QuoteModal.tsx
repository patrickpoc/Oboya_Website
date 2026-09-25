"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useShop } from "@/contexts/ShopContext";
import { getPrimaryOfficeByCountryCode } from "@/lib/shop/office-resolver";
import { useMapLocations } from "@/lib/shop/use-map-locations";
import { useProductName } from "@/lib/shop/use-product-name";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { RfqError, RfqSuccess } from "@/components/shop/states/ShopStateViews";
import { formatShopPrice } from "@/lib/shop/format-price";
import { pickLocalizedLabel } from "@/lib/shop/localized-label";
import type { ShopConfigRfqFieldKey } from "@/lib/cms/shop-config/types";
import type { Locale } from "@/i18n/routing";

const TEXT_FIELDS: Array<{
  key: ShopConfigRfqFieldKey;
  formKey: "company" | "contactName" | "email" | "phone" | "country" | "message";
  labelKey: "company" | "contactName" | "email" | "phone" | "country" | "notes";
  inputType?: string;
  maxLength?: number;
  multiline?: boolean;
}> = [
  { key: "company", formKey: "company", labelKey: "company", maxLength: 120 },
  { key: "contactName", formKey: "contactName", labelKey: "contactName", maxLength: 120 },
  { key: "email", formKey: "email", labelKey: "email", inputType: "email" },
  { key: "phone", formKey: "phone", labelKey: "phone", maxLength: 32 },
  { key: "country", formKey: "country", labelKey: "country" },
  { key: "message", formKey: "message", labelKey: "notes", multiline: true, maxLength: 2000 },
];

export function QuoteModal() {
  const t = useTranslations("shop");
  const locale = useLocale() as Locale;
  const {
    isQuoteModalOpen,
    setQuoteModalOpen,
    countryCode,
    currency,
    getLineItems,
    estimatedTotal,
    itemCount,
    submitRfq,
    rfqStatus,
    rfqReferenceId,
    resetRfqStatus,
    getProductById,
    shopConfig,
  } = useShop();
  const getProductName = useProductName();
  const { data: mapData } = useMapLocations();
  const fields = shopConfig.rfq.fields;

  const [form, setForm] = useState({
    company: "",
    contactName: "",
    email: "",
    phone: "",
    country: "",
    message: "",
    privacyAccepted: false,
    marketingOptIn: false,
  });

  const office = countryCode
    ? getPrimaryOfficeByCountryCode(countryCode, locale, mapData ?? undefined)
    : null;
  const lineItems = getLineItems();
  const intro = pickLocalizedLabel(locale, "", shopConfig.rfq.introI18n).trim();
  const confirmation = pickLocalizedLabel(
    locale,
    "",
    shopConfig.rfq.confirmationI18n
  ).trim();

  const handleClose = () => {
    resetRfqStatus();
    setQuoteModalOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetRfqStatus();
    }
    setQuoteModalOpen(open);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await submitRfq(form, office?.officeId ?? null);
      setForm({
        company: "",
        contactName: "",
        email: "",
        phone: "",
        country: "",
        message: "",
        privacyAccepted: false,
        marketingOptIn: false,
      });
    } catch {
      // rfqStatus set in context
    }
  };

  return (
    <Dialog open={isQuoteModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("requestQuotation")}</DialogTitle>
          <DialogDescription>
            {intro || t("checkoutDescription")}
          </DialogDescription>
        </DialogHeader>

        {rfqStatus === "success" && rfqReferenceId ? (
          <RfqSuccess
            referenceId={rfqReferenceId}
            onClose={handleClose}
            confirmationMessage={confirmation || undefined}
          />
        ) : rfqStatus === "error" ? (
          <RfqError onRetry={resetRfqStatus} />
        ) : (
          <>
            {itemCount === 0 ? (
              <p className="text-sm text-muted-foreground">{t("emptyCart")}</p>
            ) : (
              <>
                <div className="rounded-lg border border-border/60 bg-oboya-soft-white p-4">
                  <h3 className="text-sm font-semibold text-oboya-blue-dark">
                    {t("orderSummary")}
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {lineItems.map((item) => (
                      <li
                        key={`${item.productId}-${item.variantId ?? "base"}`}
                        className="flex justify-between gap-2"
                      >
                        <span className="truncate">
                          {getProductName(
                            getProductById(item.productId) ?? item.productId
                          )}
                          {item.variantName ? ` (${item.variantName})` : ""} ×{" "}
                          {item.quantity}
                        </span>
                        <span className="shrink-0">
                          {formatShopPrice(item.lineTotal, currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-right font-semibold text-oboya-blue-dark">
                    {formatShopPrice(estimatedTotal, currency)}
                  </p>
                </div>

                <form className="mt-4 space-y-3" onSubmit={(e) => void handleSubmit(e)}>
                  {TEXT_FIELDS.map((field) => {
                    const config = fields[field.key];
                    if (!config.visible) return null;
                    const id = `rfq-${field.formKey}`;
                    return (
                      <div key={field.key} className="space-y-1.5">
                        <label
                          htmlFor={id}
                          className="text-xs font-medium text-oboya-blue-dark"
                        >
                          {t(field.labelKey)}
                        </label>
                        {field.multiline ? (
                          <textarea
                            id={id}
                            rows={3}
                            required={config.required}
                            maxLength={field.maxLength}
                            value={form[field.formKey]}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                [field.formKey]: e.target.value,
                              }))
                            }
                            placeholder={t(field.labelKey)}
                            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                          />
                        ) : (
                          <input
                            id={id}
                            required={config.required}
                            type={field.inputType ?? "text"}
                            maxLength={field.maxLength}
                            value={form[field.formKey]}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                [field.formKey]: e.target.value,
                              }))
                            }
                            placeholder={t(field.labelKey)}
                            className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                          />
                        )}
                      </div>
                    );
                  })}

                  <p className="text-xs leading-relaxed text-oboya-blue-dark/70">
                    {t("privacyNotice")}{" "}
                    <Link
                      href="/privacy"
                      className="text-oboya-blue-light underline-offset-2 hover:underline"
                    >
                      {t("privacyLink")}
                    </Link>
                  </p>
                  <label className="flex items-start gap-2 text-xs text-oboya-blue-dark/80">
                    <input
                      type="checkbox"
                      required
                      checked={form.privacyAccepted}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, privacyAccepted: e.target.checked }))
                      }
                      className="mt-0.5 size-4 accent-oboya-blue-dark"
                    />
                    <span>{t("privacyAccept")}</span>
                  </label>
                  {fields.marketingOptIn.visible ? (
                    <label className="flex items-start gap-2 text-xs text-oboya-blue-dark/80">
                      <input
                        type="checkbox"
                        required={fields.marketingOptIn.required}
                        checked={form.marketingOptIn}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            marketingOptIn: e.target.checked,
                          }))
                        }
                        className="mt-0.5 size-4 accent-oboya-blue-dark"
                      />
                      <span>{t("marketingOptIn")}</span>
                    </label>
                  ) : null}

                  <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                    <button
                      type="submit"
                      disabled={rfqStatus === "submitting"}
                      className={buttonVariants({
                        className:
                          "flex-1 rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
                      })}
                    >
                      {rfqStatus === "submitting"
                        ? t("submitting")
                        : t("askForQuotation")}
                    </button>
                    {office && (
                      <Link
                        href={`/contact?office=${office.officeId}`}
                        className={buttonVariants({
                          variant: "outline",
                          className: "flex-1 rounded-full",
                        })}
                      >
                        {t("contactSales")}
                      </Link>
                    )}
                  </div>
                </form>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
