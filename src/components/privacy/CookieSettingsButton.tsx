"use client";

import { openCookieSettings } from "@/lib/privacy/cookie-consent";

export function CookieSettingsButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => openCookieSettings()}
    >
      {label}
    </button>
  );
}
