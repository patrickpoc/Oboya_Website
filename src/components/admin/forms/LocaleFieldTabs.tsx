"use client";

import { CMS_LOCALES } from "@/contexts/AdminContext";
import type { CmsLocale, LocalizedString } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

interface LocaleFieldTabsProps {
  value: CmsLocale;
  onChange: (locale: CmsLocale) => void;
  children: (locale: CmsLocale) => React.ReactNode;
}

/**
 * Language switcher that renders children once for the active locale.
 * Does NOT nest a Tabs provider — safe to use inside section Tabs.
 */
export function LocaleFieldTabs({ value, onChange, children }: LocaleFieldTabsProps) {
  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Language"
        className="inline-flex h-9 flex-wrap items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-1"
      >
        {CMS_LOCALES.map((loc) => {
          const active = value === loc.value;
          return (
            <button
              key={loc.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(loc.value)}
              className={cn(
                "inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "bg-white text-oboya-blue-dark shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {loc.label}
            </button>
          );
        })}
      </div>
      <div key={value}>{children(value)}</div>
    </div>
  );
}

export function emptyLocalizedString(): LocalizedString {
  return { en: "", "pt-BR": "", es: "", "zh-CN": "" };
}
