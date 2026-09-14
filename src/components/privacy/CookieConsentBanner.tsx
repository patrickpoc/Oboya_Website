"use client";

import { useEffect, useState, type WheelEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  COOKIE_CONSENT_OPEN_EVENT,
  acceptAllCookies,
  readCookieConsent,
  rejectOptionalCookies,
} from "@/lib/privacy/cookie-consent";

function passWheelToPage(event: WheelEvent<HTMLElement>) {
  if (event.ctrlKey) return;
  window.scrollBy({ top: event.deltaY, left: event.deltaX });
}

export function CookieConsentBanner() {
  const t = useTranslations("cookies");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = readCookieConsent();
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setVisible(stored === null);
    });

    const open = () => setVisible(true);
    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, open);
    return () => {
      cancelled = true;
      window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, open);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 border-t border-oboya-blue-dark/10 bg-white/75 p-4 shadow-[0_-8px_30px_rgba(1,32,63,0.08)] backdrop-blur-[2px] md:p-5"
      onWheel={passWheelToPage}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-oboya-blue-dark">{t("title")}</p>
          <p className="mt-1 text-sm leading-relaxed text-oboya-blue-dark/80">
            {t.rich("body", {
              accept: (chunks) => (
                <span className="font-semibold text-oboya-blue-dark">{chunks}</span>
              ),
              privacyPolicy: (chunks) => (
                <a
                  href={`/${locale}/privacy`}
                  className="pointer-events-auto font-medium text-oboya-blue-light underline-offset-2 hover:underline"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
        <div className="pointer-events-auto flex shrink-0 gap-2" onWheel={passWheelToPage}>
          <button
            type="button"
            className="rounded-full bg-oboya-blue-dark px-4 py-2 text-sm font-medium text-white"
            onClick={() => {
              acceptAllCookies();
              setVisible(false);
            }}
          >
            {t("accept")}
          </button>
          <button
            type="button"
            className="rounded-full border border-oboya-blue-dark/20 bg-white/50 px-4 py-2 text-sm font-medium text-oboya-blue-dark"
            onClick={() => {
              rejectOptionalCookies();
              setVisible(false);
            }}
          >
            {t("decline")}
          </button>
        </div>
      </div>
    </div>
  );
}
