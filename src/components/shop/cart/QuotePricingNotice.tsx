"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import type { QuotePricing } from "@/lib/shop/quote-pricing";
import { cn } from "@/lib/utils";

/** Info callout (not an error) explaining how items on request are priced. */
export function PricingNotice({
  pricing,
  className,
}: {
  pricing: QuotePricing;
  className?: string;
}) {
  const t = useTranslations("shop");
  if (pricing === "estimated") return null;
  return (
    <p
      role="note"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-oboya-blue/20 bg-oboya-blue/5 px-3 py-2 text-xs text-oboya-blue-dark",
        className
      )}
    >
      <Info aria-hidden className="mt-0.5 size-3.5 shrink-0 text-oboya-blue" />
      <span>
        {pricing === "mixed" ? t("pricingNoticeMixed") : t("pricingNoticeQuoteOnly")}
      </span>
    </p>
  );
}

/** "+ N items with price to be confirmed" under a partial total. */
export function PendingItemsLine({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  const t = useTranslations("shop");
  if (count <= 0) return null;
  return (
    <p className={cn("text-[11px] text-muted-foreground", className)}>
      {t("pendingItems", { count })}
    </p>
  );
}
