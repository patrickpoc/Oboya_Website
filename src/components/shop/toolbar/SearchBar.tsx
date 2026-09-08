"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useShop } from "@/contexts/ShopContext";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 350;

export function SearchBar({ className }: { className?: string }) {
  const t = useTranslations("shop");
  const { search, setSearch, countryCode } = useShop();
  const [value, setValue] = useState(search);
  const dirtyRef = useRef(false);
  const [, startTransition] = useTransition();

  // Pull from context only when this input isn't mid-edit (avoids dual-instance wipe).
  useEffect(() => {
    if (dirtyRef.current) return;
    setValue(search);
  }, [search]);

  // Push local edits to shop state (debounced + non-blocking).
  useEffect(() => {
    if (!dirtyRef.current) return;
    if (value === search) {
      dirtyRef.current = false;
      return;
    }

    const id = window.setTimeout(() => {
      startTransition(() => {
        setSearch(value);
      });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(id);
  }, [value, search, setSearch]);

  const commitClear = () => {
    dirtyRef.current = true;
    setValue("");
    startTransition(() => {
      setSearch("");
      dirtyRef.current = false;
    });
  };

  return (
    <label className={cn("relative block min-w-0 flex-1", className)}>
      <span
        className="mb-1.5 hidden text-xs font-medium text-transparent select-none lg:block"
        aria-hidden
      >
        &nbsp;
      </span>
      <span className="sr-only">{t("searchPlaceholder")}</span>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={value}
          onChange={(event) => {
            dirtyRef.current = true;
            setValue(event.target.value);
          }}
          disabled={!countryCode}
          placeholder={t("searchPlaceholder")}
          autoComplete="off"
          className={cn(
            "h-10 w-full rounded-lg border border-border bg-white pl-10 text-sm leading-normal text-oboya-blue-dark shadow-sm placeholder:text-muted-foreground disabled:opacity-50",
            "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
            value ? "pr-9" : "pr-3"
          )}
        />
        {value ? (
          <button
            type="button"
            onClick={commitClear}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-oboya-blue-dark"
            aria-label={t("clearSearch")}
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
    </label>
  );
}
