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

function officeLocationLines(office: ResolvedMapOffice) {
  const { operationType, city, facility } = office;
  const lines: string[] = [];
  if (operationType?.trim()) lines.push(operationType.trim());
  if (city?.trim()) lines.push(city.trim());
  if (facility?.trim() && facility.trim() !== operationType?.trim()) {
    lines.push(facility.trim());
  }
  return lines;
}

interface MapLocationInfoPanelProps {
  location: ResolvedMapLocation;
  fadeDuration: number;
  className?: string;
}

function ContactLinks({
  phone,
  email,
  compact,
}: {
  phone?: string;
  email?: string;
  compact?: boolean;
}) {
  if (!phone && !email) return null;
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        compact ? "min-w-0" : "shrink-0 sm:items-end sm:text-right"
      )}
    >
      {phone && (
        <a
          href={toTelHref(phone)}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium text-oboya-green hover:underline",
            !compact && "sm:justify-end"
          )}
        >
          <Phone className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{phone}</span>
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className={cn(
            "flex items-center gap-1.5 text-xs text-oboya-blue-dark/80 hover:underline",
            !compact && "sm:justify-end"
          )}
        >
          <Mail className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{email}</span>
        </a>
      )}
    </div>
  );
}

/** Single-office layout: details + contacts side by side. */
function OfficeSingle({ office }: { office: ResolvedMapOffice }) {
  const { company, partner, phone, email, segments } = office;
  const locationLines = officeLocationLines(office);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        {company && (
          <p className="text-sm font-semibold text-oboya-blue-dark">{company}</p>
        )}
        {partner && partner !== company && (
          <p className="mt-0.5 text-xs text-oboya-blue-dark/70">{partner}</p>
        )}
        {locationLines.length > 0 && (
          <div className="mt-1.5 flex items-start gap-1.5">
            <Building2
              className="mt-0.5 size-3 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div className="min-w-0 text-xs text-oboya-blue-dark/80">
              {locationLines.map((line, index) => (
                <p
                  key={`${line}-${index}`}
                  className={cn(
                    "leading-snug",
                    index > 0 && "text-[11px] text-muted-foreground"
                  )}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}
        {segments && (
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-oboya-blue-dark/70">
            {segments}
          </p>
        )}
      </div>
      <ContactLinks phone={phone} email={email} />
    </div>
  );
}

/**
 * Multi-office column: compact card for horizontal strip.
 * Only used when a country has more than one office.
 */
function OfficeColumn({ office }: { office: ResolvedMapOffice }) {
  const { company, partner, phone, email, segments, city } = office;
  const locationLines = officeLocationLines(office);
  const primaryLocation =
    city?.trim() ||
    locationLines.find((line) => line !== company)?.trim() ||
    locationLines[0];

  return (
    <div className="flex h-full w-[min(75vw,14rem)] shrink-0 flex-col gap-1.5 self-stretch border-r border-border/50 px-3 last:border-r-0 first:pl-0 last:pr-0 sm:w-auto sm:min-w-[11rem] sm:flex-1 sm:px-4">
      {company && (
        <p className="text-sm font-semibold text-oboya-blue-dark sm:truncate">
          {company}
        </p>
      )}
      {partner && partner !== company && (
        <p className="text-[11px] text-oboya-blue-dark/70 sm:truncate">{partner}</p>
      )}
      {primaryLocation && (
        <div className="flex min-w-0 items-center gap-1.5">
          <Building2
            className="size-3 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <p className="text-[11px] text-oboya-blue-dark/80 sm:truncate">
            {primaryLocation}
          </p>
        </div>
      )}
      {segments && (
        <p className="line-clamp-2 text-[11px] leading-snug text-oboya-blue-dark/70 sm:line-clamp-1">
          {segments}
        </p>
      )}
      <div className="mt-auto pt-2">
        <ContactLinks phone={phone} email={email} compact />
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
  const multiOffice = location.offices.length > 1;

  return (
    <AnimatePresence mode="sync">
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
          <div className="flex shrink-0 items-center gap-3 sm:w-[8.5rem] sm:flex-col sm:items-start sm:justify-center sm:border-r sm:border-border/50 sm:pr-5">
            {location.flag && (
              <span className="inline-flex aspect-[3/2] h-6 shrink-0 overflow-hidden rounded-[2px] border border-border/40 leading-none shadow-sm">
                <CountryFlag code={location.flag} className="h-full w-full" />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-oboya-blue-dark">
                {location.country}
              </p>
              {multiOffice && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {t("panelOfficeCount", { count: location.offices.length })}
                </p>
              )}
            </div>
          </div>

          {multiOffice ? (
            <div className="-mx-1 flex min-w-0 flex-1 items-stretch gap-0 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {location.offices.map((office) => (
                <OfficeColumn key={office.id} office={office} />
              ))}
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              {location.offices[0] ? (
                <OfficeSingle office={location.offices[0]} />
              ) : null}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
