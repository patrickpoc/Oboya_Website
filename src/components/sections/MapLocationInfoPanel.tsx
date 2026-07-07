"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CountryFlag } from "@/components/ui/country-flag";
import {
  MAP_LOCATION_FIELDS,
  type ResolvedMapLocation,
} from "@/lib/map-locations";
import { cn } from "@/lib/utils";

function toTelHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

interface MapLocationInfoPanelProps {
  location: ResolvedMapLocation;
  fadeDuration: number;
}

function FieldValue({
  value,
  href,
  className,
}: {
  value: string;
  href?: string;
  className?: string;
}) {
  if (!value) return null;

  if (href === "tel") {
    return (
      <a
        href={toTelHref(value)}
        className={cn(
          "text-sm font-medium text-oboya-green hover:underline",
          className
        )}
      >
        {value}
      </a>
    );
  }

  return (
    <p className={cn("text-sm text-oboya-blue-dark/90", className)}>{value}</p>
  );
}

export function MapLocationInfoPanel({
  location,
  fadeDuration,
}: MapLocationInfoPanelProps) {
  const country = location.country;
  const company = location.company;
  const facility = location.facility;
  const phone = location.phone;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: fadeDuration / 1000, ease: "easeInOut" }}
        className="rounded-xl border border-border/60 bg-white p-4 shadow-[var(--shadow-card)] md:p-5"
      >
        {/* Mobile: stacked layout */}
        <div className="flex flex-col gap-1 lg:hidden">
          <p className="flex items-center gap-2 text-sm font-semibold text-oboya-blue-dark">
            {location.flag && (
              <span className="inline-flex aspect-[3/2] h-4 shrink-0 overflow-hidden rounded-[2px] border border-border/40 leading-none">
                <CountryFlag code={location.flag} className="h-full w-full" />
              </span>
            )}
            <span>{country}</span>
          </p>
          {MAP_LOCATION_FIELDS.filter(
            (field) => field.key !== "country"
          ).map((field) => (
            <FieldValue
              key={field.key}
              value={location[field.key]}
              href={"href" in field ? field.href : undefined}
              className={
                field.key === "facility"
                  ? "text-xs text-muted-foreground"
                  : field.key === "company"
                    ? "mt-1"
                    : field.key === "phone"
                      ? "mt-3"
                      : undefined
              }
            />
          ))}
        </div>

        {/* Desktop: summarized horizontal layout */}
        <div className="hidden items-center gap-6 lg:flex">
          <div className="flex min-w-0 shrink-0 items-center gap-3">
            {location.flag && (
              <span className="inline-flex aspect-[3/2] h-5 shrink-0 overflow-hidden rounded-[2px] border border-border/40 leading-none">
                <CountryFlag code={location.flag} className="h-full w-full" />
              </span>
            )}
            <p className="text-base font-semibold text-oboya-blue-dark">
              {country}
            </p>
          </div>

          <div className="min-w-0 flex-1 border-l border-border/60 pl-6">
            {company && (
              <p className="truncate text-sm font-medium text-oboya-blue-dark">
                {company}
              </p>
            )}
            {facility && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {facility}
              </p>
            )}
          </div>

          {phone && (
            <a
              href={toTelHref(phone)}
              className="shrink-0 text-sm font-medium text-oboya-green hover:underline"
            >
              {phone}
            </a>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
