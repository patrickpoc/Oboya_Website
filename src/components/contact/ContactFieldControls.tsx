"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  WORLD_COUNTRIES,
  getWorldCountryByCode,
  type WorldCountry,
} from "@/lib/contact/world-countries";
import { cn } from "@/lib/utils";

export const OTHER_COUNTRY_CODE = "OTHER";

export const underlineField =
  "w-full border-0 border-b border-oboya-blue-dark/20 bg-transparent px-0 py-2 text-base text-oboya-blue-dark outline-none transition-colors placeholder:text-oboya-blue-dark/35 focus:border-oboya-blue-dark md:text-sm";

export function CharCount({ remaining }: { remaining: number }) {
  return (
    <p
      className={cn(
        "mt-1 text-right text-[11px] tabular-nums text-oboya-blue-dark/40",
        remaining <= 10 && "text-oboya-orange"
      )}
      aria-live="polite"
    >
      {remaining}
    </p>
  );
}

function useSearchableMenu(open: boolean, onClose: () => void) {
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      searchRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  return { rootRef, searchRef };
}

export function PhoneCountrySelect({
  value,
  onChange,
  label,
  searchPlaceholder,
  emptyLabel,
  id = "phoneCountry",
  buttonClassName,
}: {
  value: string;
  onChange: (code: string) => void;
  label: string;
  searchPlaceholder: string;
  emptyLabel: string;
  id?: string;
  buttonClassName?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const { rootRef, searchRef } = useSearchableMenu(open, close);

  const selected = useMemo(
    () => getWorldCountryByCode(value) ?? WORLD_COUNTRIES[0],
    [value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return WORLD_COUNTRIES;
    return WORLD_COUNTRIES.filter((country) => {
      return (
        country.name.toLowerCase().includes(q) ||
        country.dial.toLowerCase().includes(q) ||
        country.code.toLowerCase().includes(q) ||
        country.dial.replace("+", "").includes(q.replace("+", ""))
      );
    });
  }, [query]);

  const pick = (country: WorldCountry) => {
    onChange(country.code);
    close();
  };

  return (
    <div ref={rootRef} className="relative w-fit shrink-0">
      <span className="sr-only" id={`${listId}-label`}>
        {label}
      </span>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${listId}-label`}
        aria-controls={listId}
        onClick={() =>
          setOpen((prev) => {
            if (prev) setQuery("");
            return !prev;
          })
        }
        className={cn(
          buttonClassName ?? underlineField,
          "inline-flex w-auto min-w-0 items-center gap-0.5 whitespace-nowrap text-left",
          !buttonClassName && "pr-0"
        )}
      >
        <span className="tabular-nums">{selected.dial}</span>
        <ChevronDown
          className={cn(
            "size-3 shrink-0 text-oboya-blue-dark/45 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.25rem)] z-20 w-[min(18rem,calc(100vw-3rem))] overflow-hidden rounded-md border border-border/70 bg-white shadow-[var(--shadow-card)]">
          <div className="border-b border-border/60 p-2">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              autoComplete="off"
              className="h-9 w-full rounded-md border border-border/70 bg-oboya-soft-white/60 px-2.5 text-sm text-oboya-blue-dark outline-none placeholder:text-oboya-blue-dark/40 focus:border-oboya-blue-dark/40 [&::-webkit-search-cancel-button]:hidden"
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={`${listId}-label`}
            className="max-h-52 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-oboya-blue-dark/50">{emptyLabel}</li>
            ) : (
              filtered.map((country) => {
                const isSelected = country.code === selected.code;
                return (
                  <li key={country.code} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => pick(country)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-oboya-blue-dark hover:bg-oboya-soft-white",
                        isSelected && "bg-oboya-soft-white font-medium"
                      )}
                    >
                      <span>{country.name}</span>
                      <span className="tabular-nums text-oboya-blue-dark/55">{country.dial}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function CountrySelect({
  value,
  onChange,
  label,
  placeholder,
  otherLabel,
  searchPlaceholder,
  emptyLabel,
  id = "countryCode",
  required = true,
  buttonClassName,
}: {
  value: string;
  onChange: (code: string) => void;
  label: string;
  placeholder: string;
  otherLabel: string;
  searchPlaceholder: string;
  emptyLabel: string;
  id?: string;
  required?: boolean;
  buttonClassName?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const { rootRef, searchRef } = useSearchableMenu(open, close);

  const selectedName = useMemo(() => {
    if (!value) return null;
    if (value === OTHER_COUNTRY_CODE) return otherLabel;
    return getWorldCountryByCode(value)?.name ?? value;
  }, [value, otherLabel]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const countries = !q
      ? WORLD_COUNTRIES
      : WORLD_COUNTRIES.filter(
          (country) =>
            country.name.toLowerCase().includes(q) || country.code.toLowerCase().includes(q)
        );
    const showOther =
      !q ||
      otherLabel.toLowerCase().includes(q) ||
      OTHER_COUNTRY_CODE.toLowerCase().includes(q);
    return { countries, showOther };
  }, [query, otherLabel]);

  const pick = (code: string) => {
    onChange(code);
    close();
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <span className="sr-only" id={`${listId}-label`}>
        {label}
      </span>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${listId}-label`}
        aria-controls={listId}
        aria-required={required || undefined}
        onClick={() =>
          setOpen((prev) => {
            if (prev) setQuery("");
            return !prev;
          })
        }
        className={cn(
          buttonClassName ?? underlineField,
          "flex items-center justify-between gap-2 text-left",
          !selectedName && "text-oboya-blue-dark/35"
        )}
      >
        <span className="min-w-0 truncate">{selectedName ?? placeholder}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-oboya-blue-dark/45 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      <input type="hidden" name={id} value={value} required={required} />
      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.25rem)] z-20 w-full overflow-hidden rounded-md border border-border/70 bg-white shadow-[var(--shadow-card)]">
          <div className="border-b border-border/60 p-2">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              autoComplete="off"
              className="h-9 w-full rounded-md border border-border/70 bg-oboya-soft-white/60 px-2.5 text-sm text-oboya-blue-dark outline-none placeholder:text-oboya-blue-dark/40 focus:border-oboya-blue-dark/40 [&::-webkit-search-cancel-button]:hidden"
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={`${listId}-label`}
            className="max-h-52 overflow-y-auto py-1"
          >
            {filtered.countries.length === 0 && !filtered.showOther ? (
              <li className="px-3 py-2 text-sm text-oboya-blue-dark/50">{emptyLabel}</li>
            ) : (
              <>
                {filtered.countries.map((country) => {
                  const isSelected = country.code === value;
                  return (
                    <li key={country.code} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onClick={() => pick(country.code)}
                        className={cn(
                          "flex w-full items-center px-3 py-2 text-left text-sm text-oboya-blue-dark hover:bg-oboya-soft-white",
                          isSelected && "bg-oboya-soft-white font-medium"
                        )}
                      >
                        {country.name}
                      </button>
                    </li>
                  );
                })}
                {filtered.showOther ? (
                  <li role="option" aria-selected={value === OTHER_COUNTRY_CODE}>
                    <button
                      type="button"
                      onClick={() => pick(OTHER_COUNTRY_CODE)}
                      className={cn(
                        "flex w-full items-center px-3 py-2 text-left text-sm text-oboya-blue-dark hover:bg-oboya-soft-white",
                        value === OTHER_COUNTRY_CODE && "bg-oboya-soft-white font-medium"
                      )}
                    >
                      {otherLabel}
                    </button>
                  </li>
                ) : null}
              </>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
