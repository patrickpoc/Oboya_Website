"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback } from "react";

type LocalizedName = Partial<Record<"en" | "pt-BR" | "es" | "zh-CN", string>>;

function normalizeIdFallback(id: string) {
  return id
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function useProductName() {
  const tProducts = useTranslations("shop.products");
  const locale = useLocale();

  return useCallback(
    (value: string | { id: string; name?: LocalizedName }) => {
      const id = typeof value === "string" ? value : value.id;
      const localized = typeof value === "string" ? undefined : value.name;

      const fromContent =
        localized?.[locale as keyof LocalizedName] ||
        localized?.["pt-BR"] ||
        localized?.en ||
        localized?.es ||
        localized?.["zh-CN"];
      if (fromContent && fromContent.trim()) {
        return fromContent;
      }

      try {
        const translated = tProducts(id as Parameters<typeof tProducts>[0]);
        if (translated === `shop.products.${id}`) {
          return normalizeIdFallback(id);
        }
        return translated;
      } catch {
        return normalizeIdFallback(id);
      }
    },
    [locale, tProducts]
  );
}
