"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Can } from "@/components/admin/permissions/Can";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ShopCountry } from "@/lib/shop/types";

export default function Page() {
  const [countries, setCountries] = useState<ShopCountry[]>([]);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [newCurrency, setNewCurrency] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/cms/marketplace/currencies", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load currencies.");
        const payload = (await response.json()) as { countries: ShopCountry[]; currencies: string[] };
        setCountries(payload.countries);
        setCurrencies(payload.currencies);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load currencies.");
      }
    })();
  }, []);

  const currencySet = useMemo(() => new Set(currencies), [currencies]);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/cms/marketplace/currencies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countries, currencies }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Could not save currencies");
      toast.success("Currencies saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save currencies.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Can module="marketplace" action="view" fallback={<p className="text-sm text-muted-foreground">Access denied.</p>}>
      <AdminPageHeader
        title="Currencies"
        description="Create/edit currencies, connect them to countries, and reflect availability in product pricing."
        actions={
          <Button
            onClick={() => void save()}
            className="rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save currencies"}
          </Button>
        }
      />
      <Card>
        <CardContent className="space-y-6 py-6">
          <div className="rounded-lg border border-border/60 p-4">
            <p className="mb-2 text-sm font-semibold">Currency registry</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {currencies.map((code) => (
                <div key={code} className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm">
                  <span>{code}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const next = currencies.filter((item) => item !== code);
                      setCurrencies(next);
                      setCountries((prev) =>
                        prev.map((country) => {
                          const filtered = country.currencies.filter((item) => item !== code);
                          const fallback = filtered[0] ?? next[0] ?? "";
                          return {
                            ...country,
                            currencies: filtered,
                            defaultCurrency:
                              country.defaultCurrency === code ? fallback : country.defaultCurrency,
                          };
                        })
                      );
                    }}
                    className="h-6 px-1 text-xs text-destructive"
                  >
                    remove
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCurrency}
                onChange={(event) => setNewCurrency(event.target.value.toUpperCase())}
                placeholder="Add currency code (e.g. GBP)"
                maxLength={6}
              />
              <Button
                variant="outline"
                onClick={() => {
                  const code = newCurrency.trim().toUpperCase();
                  if (!/^[A-Z]{3,6}$/.test(code)) {
                    toast.error("Currency code must have 3-6 uppercase letters.");
                    return;
                  }
                  if (currencySet.has(code)) {
                    toast.error("This currency already exists.");
                    return;
                  }
                  setCurrencies([...currencies, code]);
                  setNewCurrency("");
                }}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 p-4">
            <p className="mb-3 text-sm font-semibold">Country currency mapping</p>
            <div className="space-y-3">
              {countries.map((country, countryIndex) => (
                <div key={country.code} className="rounded-md border border-border/60 p-3">
                  <p className="text-sm font-medium">
                    {country.name} ({country.code})
                  </p>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Allowed currencies</p>
                      <div className="flex flex-wrap gap-2">
                        {currencies.map((code) => {
                          const enabled = country.currencies.includes(code);
                          return (
                            <label key={`${country.code}-${code}`} className="flex items-center gap-1 text-xs">
                              <Checkbox
                                checked={enabled}
                                onCheckedChange={(checked) => {
                                  const nextCountries = [...countries];
                                  const current = nextCountries[countryIndex];
                                  const set = new Set(current.currencies);
                                  if (checked === true) set.add(code);
                                  else set.delete(code);
                                  const nextList = Array.from(set);
                                  nextCountries[countryIndex] = {
                                    ...current,
                                    currencies: nextList,
                                    defaultCurrency: nextList.includes(current.defaultCurrency)
                                      ? current.defaultCurrency
                                      : (nextList[0] ?? ""),
                                  };
                                  setCountries(nextCountries);
                                }}
                                aria-label={`Toggle ${code} for ${country.name}`}
                              />
                              {code}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Default currency</p>
                      <Select
                        value={country.defaultCurrency}
                        onValueChange={(nextValue) => {
                          const nextCountries = [...countries];
                          nextCountries[countryIndex] = {
                            ...country,
                            defaultCurrency: nextValue,
                          };
                          setCountries(nextCountries);
                        }}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {country.currencies.map((code) => (
                            <SelectItem key={`${country.code}-default-${code}`} value={code}>
                              {code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Can>
  );
}
