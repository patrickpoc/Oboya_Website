"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Link2 } from "lucide-react";

const btn =
  "inline-flex min-h-10 items-center gap-2 rounded-full border border-border/70 px-4 text-xs font-semibold text-oboya-blue-dark transition-colors hover:border-oboya-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oboya-blue";

export function ShareButtons({ url }: { url: string }) {
  const t = useTranslations("workWithUsPage.detail.share");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <p className="mb-3 text-xs font-semibold tracking-wide text-oboya-blue-dark/60 uppercase">{t("title")}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copy} className={btn}>
          {copied ? <Check className="size-4 text-oboya-green" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
          {t("copyLink")}
        </button>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
        >
          {t("linkedin")}
        </a>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {copied ? t("copied") : ""}
      </p>
      {copied ? (
        <p className="mt-2 text-xs text-oboya-green" aria-hidden>
          {t("copied")}
        </p>
      ) : null}
    </div>
  );
}
