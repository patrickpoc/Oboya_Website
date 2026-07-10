"use client";

import { Building2, Clock, Mail, Phone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { CountryFlag } from "@/components/ui/country-flag";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useShop } from "@/contexts/ShopContext";
import { getPrimaryOfficeByCountryCode } from "@/lib/shop/office-resolver";
import { useMapLocations } from "@/lib/shop/use-map-locations";
import type { Locale } from "@/i18n/routing";

function toTelHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function OfficeCard() {
  const t = useTranslations("shop");
  const locale = useLocale() as Locale;
  const { countryCode } = useShop();
  const { data: mapData } = useMapLocations();

  if (!countryCode) return null;

  const office = getPrimaryOfficeByCountryCode(countryCode, locale, mapData ?? undefined);
  if (!office) return null;

  return (
    <section className="border-b border-border/60 bg-oboya-soft-white py-6">
      <Container>
        <div className="rounded-xl border border-border/60 bg-white p-5 shadow-[var(--shadow-card)] md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-4">
              <span className="inline-flex aspect-[3/2] h-8 shrink-0 overflow-hidden rounded-[3px] border border-border/40 shadow-sm">
                <CountryFlag code={office.flag} className="h-full w-full" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-[0.15em] text-oboya-green uppercase">
                  {t("officeCardEyebrow")}
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold text-oboya-blue-dark">
                  {office.partner || office.company}
                </h2>
                <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                  <Building2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <div>
                    {office.operationType && <p>{office.operationType}</p>}
                    {office.city && <p>{office.city}</p>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {office.phone && (
                    <a
                      href={toTelHref(office.phone)}
                      className="inline-flex items-center gap-1.5 text-oboya-blue-dark hover:text-oboya-green"
                    >
                      <Phone className="size-3.5" aria-hidden />
                      {office.phone}
                    </a>
                  )}
                  {office.email && (
                    <a
                      href={`mailto:${office.email}`}
                      className="inline-flex items-center gap-1.5 text-oboya-blue-dark hover:text-oboya-green"
                    >
                      <Mail className="size-3.5" aria-hidden />
                      {office.email}
                    </a>
                  )}
                  {office.businessHours && (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="size-3.5" aria-hidden />
                      {office.businessHours}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              href={`/contact?office=${office.officeId}`}
              className={buttonVariants({
                size: "cta",
                className:
                  "shrink-0 bg-oboya-green text-white hover:bg-oboya-green/90",
              })}
            >
              {t("contactSales")}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
