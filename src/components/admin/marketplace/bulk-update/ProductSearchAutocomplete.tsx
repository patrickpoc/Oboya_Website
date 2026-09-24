"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import {
  displaySearchHitImage,
  displaySearchHitLabel,
  searchSkuHitsForBulkUpdate,
  type BulkSkuSearchHit,
} from "@/lib/cms/bulk-update/search-products";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  products: CmsProduct[];
  excludeIds: Set<string>;
  onSelect: (hit: BulkSkuSearchHit) => void;
  preferredLocale?: string;
  disabled?: boolean;
};

export function ProductSearchAutocomplete({
  products,
  excludeIds,
  onSelect,
  preferredLocale = "en",
  disabled = false,
}: Props) {
  const t = useTranslations("admin.products.bulk");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const suggestions = useMemo(
    () =>
      disabled
        ? []
        : searchSkuHitsForBulkUpdate(products, debounced, {
            limit: 10,
            excludeIds,
          }),
    [products, debounced, excludeIds, disabled]
  );

  return (
    <div ref={rootRef} className="relative">
      <Input
        value={query}
        disabled={disabled}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        placeholder={
          disabled
            ? t("maxSelectedPlaceholder")
            : t("searchPlaceholder")
        }
        className="h-10"
        aria-autocomplete="list"
        aria-expanded={!disabled && open && suggestions.length > 0}
      />

      {!disabled && open && debounced.length >= 2 && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-border/70 bg-white shadow-lg">
          {suggestions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">{t("noProductsFound")}</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {suggestions.map((hit) => {
                const product = hit.product;
                const image = displaySearchHitImage(hit);
                const label = displaySearchHitLabel(hit, preferredLocale);
                return (
                  <li key={`${product.id}-${hit.variantId ?? "parent"}-${hit.matchedSku}`}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-oboya-soft-white"
                      )}
                      onClick={() => {
                        onSelect(hit);
                        setQuery("");
                        setDebounced("");
                        setOpen(false);
                      }}
                    >
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        {image ? (
                          <Image
                            src={image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="40px"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-oboya-blue-dark">
                          {label}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {hit.isChildSku
                            ? t("childSkuHint", {
                                child: hit.matchedSku,
                                parent: product.sku,
                              })
                            : hit.matchedSku}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
