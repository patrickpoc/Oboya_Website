"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const t = useTranslations("admin.common");
  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t("search")}
        className="h-9 pr-8 pl-8 text-sm"
        aria-label={placeholder ?? t("search")}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("clearSearch")}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-oboya-blue-dark"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export type FilterTabOption = { value: string; label: React.ReactNode; count?: number };

/** Segmented tabs with optional counters (e.g. inbox status buckets). */
export function FilterTabs({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: FilterTabOption[];
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-border/60 bg-muted/40 p-1",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
              active ? "bg-white text-oboya-blue-dark shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 text-[10px] leading-4",
                  active ? "bg-oboya-blue text-white" : "bg-border/70 text-oboya-blue-dark/70"
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  allLabel?: string;
}) {
  const t = useTranslations("admin.common");
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="whitespace-nowrap">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-8 max-w-44 rounded-md border bg-white px-2 text-xs text-oboya-blue-dark",
          value ? "border-oboya-blue/50" : "border-border/70"
        )}
      >
        <option value="">{allLabel ?? t("all")}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Wraps search + selects + trailing actions in a consistent toolbar row. */
export function FilterBar({
  children,
  actions,
  onReset,
  showReset,
  className,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  onReset?: () => void;
  showReset?: boolean;
  className?: string;
}) {
  const t = useTranslations("admin.common");
  return (
    <div className={cn("flex flex-col gap-3 lg:flex-row lg:items-center", className)}>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {children}
        {showReset && onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-oboya-blue-light hover:underline"
          >
            {t("clearFilters")}
          </button>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
