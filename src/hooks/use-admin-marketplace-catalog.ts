"use client";

import { useEffect, useState } from "react";
import { getShopCatalog, updateShopCatalog } from "@/lib/shop/catalog";
import type { ShopBrand, ShopCategory, ShopCountry, ShopFilterOptions } from "@/lib/shop/types";

export function useAdminMarketplaceCatalog() {
  const [catalog, setCatalog] = useState(() => getShopCatalog());
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [filtersResponse, currenciesResponse] = await Promise.all([
          fetch("/api/cms/marketplace/filters", { cache: "no-store" }),
          fetch("/api/cms/marketplace/currencies", { cache: "no-store" }),
        ]);

        if (filtersResponse.ok && !cancelled) {
          const data = (await filtersResponse.json()) as {
            categories: ShopCategory[];
            brands: ShopBrand[];
            filterOptions: ShopFilterOptions;
          };

          updateShopCatalog({
            categories: data.categories,
            brands: data.brands,
            filterOptions: data.filterOptions,
          });
        }

        if (currenciesResponse.ok && !cancelled) {
          const data = (await currenciesResponse.json()) as {
            countries?: ShopCountry[];
            currencies?: string[];
          };

          if (data.countries) {
            updateShopCatalog({ countries: data.countries });
          }
          if (data.currencies) {
            setCurrencies(data.currencies);
          }
        }

        if (!cancelled) {
          setCatalog(getShopCatalog());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { catalog, currencies, loading };
}
