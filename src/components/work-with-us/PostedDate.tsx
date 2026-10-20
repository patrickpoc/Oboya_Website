"use client";

import { useSyncExternalStore } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { formatDate } from "./opening-format";

const noop = () => () => {};

/** Absolute date on the server; relative time after mount (avoids ISR/hydration mismatch). */
export function PostedDate({ iso, className }: { iso: string; className?: string }) {
  const t = useTranslations("workWithUsPage.card");
  const locale = useLocale();
  const format = useFormatter();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const text = mounted ? format.relativeTime(new Date(iso), new Date()) : formatDate(iso, locale);
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {t("posted", { date: text })}
    </time>
  );
}
