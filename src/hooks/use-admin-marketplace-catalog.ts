"use client";

import { useEffect, useState } from "react";
import { getShopCatalog, updateShopCatalog } from "@/lib/shop/catalog";
import type {
  ShopBrand,
  ShopCatalog,
  ShopCategory,
  ShopCountry,
  ShopFilterGroup,
  ShopFilterOptions,
} from "@/lib/shop/types";

/** Snapshot so React setState sees a new reference after mutating the module singleton. */
function snapshotCatalog(): ShopCatalog {
  const current = getShopCatalog();
  return {
    countries: current.countries,
    categories: current.categories,
    brands: current.brands,
    filterGroups: current.filterGroups,
    filterOptions: current.filterOptions,
    products: current.products,
  };
}

export function useAdminMarketplaceCatalog() {
  const [catalog, setCatalog] = useState(() => snapshotCatalog());
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
            filterGroups?: ShopFilterGroup[];
            filterOptions: ShopFilterOptions;
          };

          updateShopCatalog({
            categories: data.categories,
            brands: data.brands,
            filterGroups: data.filterGroups,
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
          setCatalog(snapshotCatalog());
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
