"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import {
  ADMIN_LOCALE_OPTIONS,
  useAdminLocale,
} from "@/contexts/AdminLocaleContext";
import type { CmsLocale } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

export function AdminLanguageSwitcher() {
  const t = useTranslations("admin.topbar");
  const { locale, setLocale } = useAdminLocale();
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

  const current =
    ADMIN_LOCALE_OPTIONS.find((item) => item.value === locale) ??
    ADMIN_LOCALE_OPTIONS[0];

  const handleSelect = (next: CmsLocale) => {
    setLocale(next);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "relative flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted",
          open && "bg-muted text-oboya-blue-dark"
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${t("language")}: ${current.label}`}
      >
        <Globe className="size-4" />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={t("language")}
          className="absolute top-full right-0 z-50 mt-2 min-w-[10.5rem] overflow-hidden rounded-xl border border-border/60 bg-white py-1 shadow-[var(--shadow-card)]"
        >
          {ADMIN_LOCALE_OPTIONS.map((item) => (
            <li key={item.value} role="option" aria-selected={item.value === locale}>
              <button
                type="button"
                onClick={() => handleSelect(item.value)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-oboya-soft-white",
                  item.value === locale
                    ? "font-semibold text-oboya-green"
                    : "text-oboya-blue-dark"
                )}
              >
                <span>{item.label}</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {item.short}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
