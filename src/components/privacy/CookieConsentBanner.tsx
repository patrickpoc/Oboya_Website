"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  COOKIE_CONSENT_OPEN_EVENT,
  COOKIE_CONSENT_VERSION,
  acceptAllCookies,
  readCookieConsent,
  readLegacyAnalyticsPreference,
  rejectOptionalCookies,
  writeCookieConsent,
} from "@/lib/privacy/cookie-consent";

export function CookieConsentBanner() {
  const t = useTranslations("cookies");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const stored = readCookieConsent();
    const legacyAnalytics = readLegacyAnalyticsPreference();
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setAnalytics(stored?.analytics ?? legacyAnalytics ?? false);
      setVisible(stored === null);
    });

    const open = () => {
      const current = readCookieConsent();
      setAnalytics(current?.analytics ?? readLegacyAnalyticsPreference() ?? false);
      setVisible(true);
    };
    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, open);
    return () => {
      cancelled = true;
      window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, open);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-oboya-blue-dark/10 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(1,32,63,0.12)] backdrop-blur md:p-5">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-8">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-oboya-blue-dark">{t("title")}</p>
            <p className="mt-1 text-sm leading-relaxed text-oboya-blue-dark/80">
              {t.rich("body", {
                accept: (chunks) => (
                  <span className="font-semibold text-oboya-blue-dark">{chunks}</span>
                ),
                cookiePolicy: (chunks) => (
                  <a
                    href={`/${locale}/cookies`}
                    className="font-medium text-oboya-blue-light underline-offset-2 hover:underline"
                  >
                    {chunks}
                  </a>
                ),
                privacyPolicy: (chunks) => (
                  <a
                    href={`/${locale}/privacy`}
                    className="font-medium text-oboya-blue-light underline-offset-2 hover:underline"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              className="rounded-full border border-oboya-blue-dark/20 px-4 py-2 text-sm font-medium text-oboya-blue-dark"
              onClick={() => {
                rejectOptionalCookies();
                setVisible(false);
              }}
            >
              {t("rejectOptional")}
            </button>
            <button
              type="button"
              className="rounded-full bg-oboya-blue-dark px-4 py-2 text-sm font-medium text-white"
              onClick={() => {
                acceptAllCookies();
                setVisible(false);
              }}
            >
              {t("acceptAll")}
            </button>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-oboya-blue-dark/10 bg-oboya-soft-white/80 p-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-oboya-blue-dark">
              {t("necessaryTitle")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-oboya-blue-dark/70">
              {t("necessaryBody")}
            </p>
            <p className="mt-2 text-xs font-medium text-oboya-blue-dark/55">{t("alwaysOn")}</p>
          </div>
          <label className="flex cursor-pointer items-start justify-between gap-3">
            <span>
              <span className="block text-xs font-semibold uppercase tracking-wider text-oboya-blue-dark">
                {t("analyticsTitle")}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-oboya-blue-dark/70">
                {t("analyticsBody")}
              </span>
            </span>
            <input
              type="checkbox"
              className="mt-1 size-4 accent-oboya-blue"
              checked={analytics}
              onChange={(event) => setAnalytics(event.target.checked)}
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="text-xs font-medium text-oboya-blue-light underline-offset-2 hover:underline"
            onClick={() => {
              writeCookieConsent({
                v: COOKIE_CONSENT_VERSION,
                necessary: true,
                analytics,
                updatedAt: new Date().toISOString(),
              });
              setVisible(false);
            }}
          >
            {t("savePreferences")}
          </button>
        </div>
      </div>
    </div>
  );
}
