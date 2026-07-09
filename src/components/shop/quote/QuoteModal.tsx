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
import type { Locale } from "@/i18n/routing";

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
  } = useShop();
  const getProductName = useProductName();
  const { data: mapData } = useMapLocations();

  const [form, setForm] = useState({
    company: "",
    contactName: "",
    email: "",
    phone: "",
    country: "",
    message: "",
  });

  const office = countryCode
    ? getPrimaryOfficeByCountryCode(countryCode, locale, mapData ?? undefined)
    : null;
  const lineItems = getLineItems();

  const handleClose = () => {
    setQuoteModalOpen(false);
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
      });
    } catch {
      // rfqStatus set in context
    }
  };

  return (
    <Dialog open={isQuoteModalOpen} onOpenChange={setQuoteModalOpen}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("requestQuotation")}</DialogTitle>
          <DialogDescription>{t("checkoutDescription")}</DialogDescription>
        </DialogHeader>

        {rfqStatus === "success" && rfqReferenceId ? (
          <RfqSuccess referenceId={rfqReferenceId} onClose={handleClose} />
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
                      <li key={item.productId} className="flex justify-between gap-2">
                        <span className="truncate">
                          {getProductName(item.productId)} × {item.quantity}
                        </span>
                        <span className="shrink-0">
                          {currency} {item.lineTotal.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-right font-semibold text-oboya-blue-dark">
                    {currency} {estimatedTotal.toFixed(2)}
                  </p>
                </div>

                <form className="mt-4 space-y-3" onSubmit={(e) => void handleSubmit(e)}>
                  <input
                    required
                    value={form.company}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, company: e.target.value }))
                    }
                    placeholder={t("company")}
                    className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                  />
                  <input
                    required
                    value={form.contactName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, contactName: e.target.value }))
                    }
                    placeholder={t("contactName")}
                    className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                  />
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder={t("email")}
                    className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                  />
                  <input
                    required
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder={t("phone")}
                    className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                  />
                  <input
                    required
                    value={form.country}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, country: e.target.value }))
                    }
                    placeholder={t("country")}
                    className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                  />
                  <textarea
                    rows={3}
                    value={form.message}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, message: e.target.value }))
                    }
                    placeholder={t("notes")}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />

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
