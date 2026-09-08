"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  light?: boolean;
  className?: string;
}

function useLanguageSwitch(onAfterChange?: () => void) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleChange = (nextLocale: Locale) => {
    router.replace(pathname, { locale: nextLocale });
    setOpen(false);
    onAfterChange?.();
  };

  return {
    locale,
    open,
    setOpen,
    rootRef,
    handleChange,
    toggle: () => setOpen((prev) => !prev),
  };
}

function LanguageMenu({
  locale,
  onSelect,
  className,
}: {
  locale: Locale;
  onSelect: (next: Locale) => void;
  className?: string;
}) {
  const t = useTranslations("nav");

  return (
    <ul
      role="listbox"
      aria-label={t("language")}
      className={cn(
        "min-w-[10rem] overflow-hidden rounded-xl border bg-white py-1 shadow-[var(--shadow-card)]",
        className
      )}
    >
      {locales.map((loc) => (
        <li key={loc} role="option" aria-selected={loc === locale}>
          <button
            type="button"
            onClick={() => onSelect(loc)}
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
  );
}

/** Navbar globe control — click dropdown on mobile and desktop. */
export function LanguageSwitcher({ light, className }: LanguageSwitcherProps) {
  const t = useTranslations("nav");
  const { locale, open, rootRef, handleChange, toggle } = useLanguageSwitch();

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={toggle}
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

      {open ? (
        <div className="absolute top-full right-0 z-50 pt-2">
          <LanguageMenu locale={locale} onSelect={handleChange} />
        </div>
      ) : null}
    </div>
  );
}

/** Mobile sheet / denser layouts — labeled language dropdown. */
export function LanguageSwitcherMobile({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const t = useTranslations("nav");
  const { locale, open, rootRef, handleChange, toggle } =
    useLanguageSwitch(onNavigate);

  return (
    <div ref={rootRef} className="border-b border-border/60 py-4">
      <p className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {t("language")}
      </p>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-white px-3.5 text-left text-sm text-oboya-blue-dark shadow-sm transition-colors",
          "hover:bg-oboya-soft-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-blue/30",
          open && "rounded-b-none border-b-transparent bg-oboya-soft-white"
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <Globe className="size-4 shrink-0 text-oboya-blue" aria-hidden />
          <span className="truncate font-medium">{localeLabels[locale]}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <LanguageMenu
          locale={locale}
          onSelect={handleChange}
          className="w-full rounded-t-none border-t-0 shadow-none"
        />
      ) : null}
    </div>
  );
}
