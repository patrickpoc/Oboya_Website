"use client";

import { Globe, PackageOpen, SearchX, ShoppingBag, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";

export function SelectCountryPrompt() {
  const t = useTranslations("shop");

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-oboya-soft-white px-6 py-16 text-center">
      <Globe className="size-10 text-oboya-green" aria-hidden />
      <h3 className="mt-4 font-display text-lg font-semibold text-oboya-blue-dark">
        {t("selectCountryPromptTitle")}
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {t("selectCountryPromptDesc")}
      </p>
    </div>
  );
}

export function EmptyResults() {
  const t = useTranslations("shop");

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-white px-6 py-16 text-center">
      <SearchX className="size-10 text-muted-foreground" aria-hidden />
      <h3 className="mt-4 font-semibold text-oboya-blue-dark">{t("noResultsTitle")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t("noResultsDesc")}</p>
    </div>
  );
}

export function EmptyQuote({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("shop");

  return (
    <div
      className={
        compact
          ? "py-8 text-center"
          : "flex flex-col items-center justify-center rounded-xl border border-border/60 bg-white px-6 py-12 text-center"
      }
    >
      <ShoppingBag
        className={compact ? "mx-auto size-8 text-muted-foreground" : "size-10 text-muted-foreground"}
        aria-hidden
      />
      <p className="mt-3 text-sm text-muted-foreground">{t("emptyQuote")}</p>
    </div>
  );
}

export function LoadingSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[4/5] w-full rounded-xl" />
      ))}
    </div>
  );
}

export function ErrorState() {
  const t = useTranslations("shop");

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <p className="text-sm text-destructive">{t("loadError")}</p>
    </div>
  );
}

export function OfflineBanner() {
  const t = useTranslations("shop");

  return (
    <div className="flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-800">
      <WifiOff className="size-4" aria-hidden />
      {t("offlineMessage")}
    </div>
  );
}

export function RfqSuccess({
  referenceId,
  onClose,
}: {
  referenceId: string;
  onClose: () => void;
}) {
  const t = useTranslations("shop");

  return (
    <div className="rounded-xl border border-oboya-green/30 bg-oboya-green/5 p-6 text-center">
      <PackageOpen className="mx-auto size-10 text-oboya-green" aria-hidden />
      <h3 className="mt-3 font-semibold text-oboya-blue-dark">{t("quoteConfirmed")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("quoteNumber", { id: referenceId })}
      </p>
      <button
        type="button"
        onClick={onClose}
        className={buttonVariants({
          className:
            "mt-6 rounded-full bg-oboya-green px-6 text-white hover:bg-oboya-green/90",
        })}
      >
        {t("continueBrowsing")}
      </button>
    </div>
  );
}

export function RfqError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("shop");

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p className="text-sm text-destructive">{t("rfqError")}</p>
      <button
        type="button"
        onClick={onRetry}
        className={buttonVariants({
          variant: "outline",
          className: "mt-4 rounded-full",
        })}
      >
        {t("retry")}
      </button>
    </div>
  );
}
