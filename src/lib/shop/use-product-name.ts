"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

export function useProductName() {
  const tProducts = useTranslations("shop.products");

  return useCallback(
    (id: string) => {
      try {
        return tProducts(id as Parameters<typeof tProducts>[0]);
      } catch {
        return id;
      }
    },
    [tProducts]
  );
}
