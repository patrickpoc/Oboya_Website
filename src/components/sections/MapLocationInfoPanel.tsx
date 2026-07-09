"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Building2, Mail, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { CountryFlag } from "@/components/ui/country-flag";
import type {
  ResolvedMapLocation,
  ResolvedMapOffice,
} from "@/lib/map-locations";
import { cn } from "@/lib/utils";

function toTelHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

interface MapLocationInfoPanelProps {
  location: ResolvedMapLocation;
  fadeDuration: number;
  className?: string;
}

function OfficeRow({ office }: { office: ResolvedMapOffice }) {
  const { company, partner, operationType, city, facility, phone, email, segments } =
    office;

  return (
    <div className="border-b border-border/40 py-2.5 last:border-b-0 last:pb-0 first:pt-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          {company && (
            <p className="text-sm font-semibold text-oboya-blue-dark">{company}</p>
          )}
          {partner && partner !== company && (
            <p className="mt-0.5 text-xs text-oboya-blue-dark/70">{partner}</p>
          )}
          {(operationType || city || facility) && (
            <div className="mt-1.5 flex items-start gap-1.5">
              <Building2
                className="mt-0.5 size-3 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="min-w-0 text-xs text-oboya-blue-dark/80">
                {operationType && <p className="leading-snug">{operationType}</p>}
                {city && (
                  <p className="text-[11px] text-muted-foreground">{city}</p>
                )}
                {facility && (
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {facility}
                  </p>
                )}
              </div>
            </div>
          )}
          {segments && (
            <p className="mt-1.5 truncate text-[11px] text-oboya-blue-dark/70">
              {segments}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-1 sm:items-end sm:text-right">
          {phone && (
            <a
              href={toTelHref(phone)}
              className="flex items-center gap-1.5 text-xs font-medium text-oboya-green hover:underline sm:justify-end"
            >
              <Phone className="size-3 shrink-0" aria-hidden />
              <span>{phone}</span>
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1.5 text-xs text-oboya-blue-dark/80 hover:underline sm:justify-end"
            >
              <Mail className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{email}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function MapLocationInfoPanel({
  location,
  fadeDuration,
  className,
}: MapLocationInfoPanelProps) {
  const t = useTranslations("globalPresence");

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: fadeDuration / 1000, ease: "easeInOut" }}
        className={cn(
          "rounded-lg border border-border/60 border-l-2 border-l-oboya-green bg-white px-4 py-3 shadow-[var(--shadow-card)] md:px-5 md:py-4",
          className
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-5">
          <div className="flex shrink-0 items-center gap-3 sm:w-[9.5rem] sm:flex-col sm:items-start sm:justify-center sm:border-r sm:border-border/50 sm:pr-5">
            {location.flag && (
              <span className="inline-flex aspect-[3/2] h-6 shrink-0 overflow-hidden rounded-[2px] border border-border/40 leading-none shadow-sm">
                <CountryFlag code={location.flag} className="h-full w-full" />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-oboya-blue-dark">
                {location.country}
              </p>
              {location.offices.length > 1 && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {t("panelOfficeCount", { count: location.offices.length })}
                </p>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {location.offices.map((office) => (
              <OfficeRow key={office.id} office={office} />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
