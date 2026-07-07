"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  light?: boolean;
  className?: string;
}

export function LanguageSwitcher({ light, className }: LanguageSwitcherProps) {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (nextLocale: Locale) => {
    router.replace(pathname, { locale: nextLocale });
    setOpen(false);
  };

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => setOpen(false), 200);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className={cn(
          "flex size-9 items-center justify-center rounded-full transition-colors",
          light
            ? "text-white/90 hover:bg-white/15 hover:text-white"
            : "text-oboya-blue-dark hover:bg-oboya-soft-white",
          open && (light ? "bg-white/15" : "bg-oboya-soft-white")
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${t("language")}: ${localeLabels[locale]}`}
      >
        <Globe className="size-5 shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 pt-2">
          <ul
            role="listbox"
            aria-label={t("language")}
            className="min-w-[10rem] overflow-hidden rounded-xl border bg-white py-1 shadow-[var(--shadow-card)]"
          >
            {locales.map((loc) => (
              <li key={loc} role="option" aria-selected={loc === locale}>
                <button
                  type="button"
                  onClick={() => handleChange(loc)}
                  className={cn(
                    "w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-oboya-soft-white",
                    loc === locale
                      ? "font-semibold text-oboya-green"
                      : "text-oboya-blue-dark"
                  )}
                >
                  {localeLabels[loc]}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function LanguageSwitcherMobile({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (nextLocale: Locale) => {
    router.replace(pathname, { locale: nextLocale });
    onNavigate?.();
  };

  return (
    <div className="border-b border-border/60 py-4">
      <p className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {t("language")}
      </p>
      <div className="flex flex-col gap-1">
        {locales.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => handleChange(loc)}
            className={cn(
              "rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
              loc === locale
                ? "bg-oboya-green/10 font-semibold text-oboya-green"
                : "text-oboya-blue-dark hover:bg-oboya-soft-white"
            )}
          >
            {localeLabels[loc]}
          </button>
        ))}
      </div>
    </div>
  );
}
