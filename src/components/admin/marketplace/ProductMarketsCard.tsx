"use client";

import { useMemo } from "react";
import { RegistrationSection } from "@/components/admin/marketplace/RegistrationSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { ShopCountry } from "@/lib/shop/types";
import { cn } from "@/lib/utils";

interface ProductMarketsCardProps {
  product: CmsProduct;
  countries: ShopCountry[];
  onUpdate: (patch: Partial<CmsProduct>) => void;
}

export function ProductMarketsCard({ product, countries, onUpdate }: ProductMarketsCardProps) {
  const enabledCountries = useMemo(() => {
    const map = product.enabledCountries ?? product.availability;
    return countries.filter((country) => Boolean(map[country.code]));
  }, [countries, product.availability, product.enabledCountries]);

  const toggleCountry = (countryCode: string, enabled: boolean) => {
    const next = { ...(product.enabledCountries ?? {}) };
    next[countryCode] = enabled;
    onUpdate({ enabledCountries: next, availability: { ...next } });
  };

  const setAllCountries = (enabled: boolean) => {
    const next: Record<string, boolean> = {};
    countries.forEach((country) => {
      next[country.code] = enabled;
    });
    onUpdate({ enabledCountries: next, availability: { ...next } });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Market availability</CardTitle>
        <CardDescription>Countries where this product can be sold.</CardDescription>
      </CardHeader>

      <CardContent>
        <RegistrationSection
          title="Markets"
          description="Enable countries after pricing is configured."
          isFirst
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-muted-foreground">
                {enabledCountries.length} of {countries.length} enabled
              </span>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setAllCountries(true)}
              >
                Enable all
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setAllCountries(false)}
              >
                Disable all
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {countries.map((country) => {
                const enabled = Boolean(
                  (product.enabledCountries ?? product.availability)[country.code]
                );
                return (
                  <label
                    key={country.code}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm",
                      enabled
                        ? "border-oboya-green/30 bg-oboya-green/5"
                        : "border-border/60 bg-background"
                    )}
                  >
                    <span>{country.name}</span>
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input"
                      checked={enabled}
                      onChange={(e) => toggleCountry(country.code, e.target.checked)}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </RegistrationSection>
      </CardContent>
    </Card>
  );
}
