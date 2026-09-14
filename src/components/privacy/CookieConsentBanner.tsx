"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  readAnalyticsConsent,
  writeAnalyticsConsent,
} from "@/lib/privacy/analytics-consent";

export function CookieConsentBanner() {
  const t = useTranslations("cookies");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readAnalyticsConsent() === null);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-oboya-blue-dark/10 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(1,32,63,0.12)] backdrop-blur md:p-5">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-relaxed text-oboya-blue-dark/80">
          {t("body")}{" "}
          <a
            href={`/${locale}/privacy`}
            className="font-medium text-oboya-blue-light underline-offset-2 hover:underline"
          >
            {t("privacyLink")}
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="rounded-full border border-oboya-blue-dark/20 px-4 py-2 text-sm font-medium text-oboya-blue-dark"
            onClick={() => {
              writeAnalyticsConsent("declined");
              setVisible(false);
            }}
          >
            {t("decline")}
          </button>
          <button
            type="button"
            className="rounded-full bg-oboya-blue-dark px-4 py-2 text-sm font-medium text-white"
            onClick={() => {
              writeAnalyticsConsent("accepted");
              setVisible(false);
            }}
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
