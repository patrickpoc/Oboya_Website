"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EditorGuard } from "@/components/admin/common";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Can } from "@/components/admin/permissions/Can";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CountryFlag } from "@/components/ui/country-flag";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";
import { getCountryCode } from "@/constants/country-flags";
import { WORLD_COUNTRIES } from "@/lib/contact/world-countries";
import type { StoreCountry } from "@/lib/cms/marketplace-countries";
import { useMapLocations } from "@/lib/shop/use-map-locations";

const NO_OFFICE = "__none__";

export default function Page() {
  const t = useTranslations("admin.currencies");
  const tCommon = useTranslations("admin.common");
  const tApprovals = useTranslations("admin.approvals");
  const [countries, setCountries] = useState<StoreCountry[]>([]);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [newCurrency, setNewCurrency] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [removing, setRemoving] = useState<StoreCountry | null>(null);
  const { data: mapData } = useMapLocations();

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/cms/marketplace/currencies?includeInactive=1", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(t("loadFailed"));
        const payload = (await response.json()) as {
          countries: StoreCountry[];
          currencies: string[];
          productCounts?: Record<string, number>;
        };
        setCountries(payload.countries);
        setCurrencies(payload.currencies);
        setProductCounts(payload.productCounts ?? {});
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("loadFailed"));
      }
    })();
  }, [t]);

  const currencySet = useMemo(() => new Set(currencies), [currencies]);

  const officesFor = (code: string) =>
    (mapData?.locations ?? [])
      .filter((location) => getCountryCode(location.flag) === code)
      .flatMap((location) => location.offices)
      .map((office) => {
        const info = office.translations.en;
        const label = [info?.company, info?.city].filter(Boolean).join(" · ");
        return { id: office.id, label: label || office.id };
      });

  const visibleCountries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return countries;
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(needle) ||
        country.code.toLowerCase().includes(needle)
    );
  }, [countries, query]);

  const addable = useMemo(() => {
    const taken = new Set(countries.map((country) => country.code));
    const needle = addQuery.trim().toLowerCase();
    return WORLD_COUNTRIES.filter(
      (country) =>
        !taken.has(country.code) &&
        (!needle ||
          country.name.toLowerCase().includes(needle) ||
          country.code.toLowerCase().includes(needle))
    );
  }, [countries, addQuery]);

  const update = (code: string, patch: Partial<StoreCountry>) => {
    setCountries((prev) =>
      prev.map((country) => (country.code === code ? { ...country, ...patch } : country))
    );
    setDirty(true);
  };

  const addCountry = (code: string, name: string) => {
    const first = currencies[0] ?? "";
    setCountries((prev) => [
      ...prev,
      { code, name, currencies: first ? [first] : [], defaultCurrency: first, active: true },
    ]);
    setDirty(true);
    setAddOpen(false);
    setAddQuery("");
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/cms/marketplace/currencies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countries, currencies }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        countries?: StoreCountry[];
        pendingApproval?: unknown;
      } | null;
      if (!response.ok) throw new Error(payload?.error ?? t("saveFailed"));
      if (payload?.pendingApproval) {
        // Held deactivations/removals stay as they are until approved.
        if (payload.countries) setCountries(payload.countries);
        toast.success(tApprovals(response.status === 202 ? "toast.submitted" : "toast.partial"));
      } else {
        toast.success(t("saved"));
      }
      setDirty(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Can module="marketplace" action="view" fallback={<AccessDenied />}>
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button
            onClick={() => void save()}
            className="rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
            disabled={saving}
          >
            {saving ? tCommon("saving") : t("saveCurrencies")}
          </Button>
        }
      />
      <Card>
        <CardContent className="space-y-6 py-6">
          <div className="rounded-lg border border-border/60 p-4">
            <p className="mb-2 text-sm font-semibold">{t("registry")}</p>
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
                      setDirty(true);
                    }}
                    className="h-6 px-1 text-xs text-destructive"
                  >
                    {tCommon("remove")}
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCurrency}
                onChange={(event) => setNewCurrency(event.target.value.toUpperCase())}
                placeholder={t("addPlaceholder")}
                maxLength={6}
              />
              <Button
                variant="outline"
                onClick={() => {
                  const code = newCurrency.trim().toUpperCase();
                  if (!/^[A-Z]{3,6}$/.test(code)) {
                    toast.error(t("invalidCode"));
                    return;
                  }
                  if (currencySet.has(code)) {
                    toast.error(t("alreadyExists"));
                    return;
                  }
                  setCurrencies([...currencies, code]);
                  setNewCurrency("");
                  setDirty(true);
                }}
              >
                {tCommon("add")}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{t("mapping")}</p>
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="h-9 w-56"
                />
                <Button variant="outline" onClick={() => setAddOpen(true)}>
                  {t("addCountry")}
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {visibleCountries.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("noCountries")}</p>
              )}
              {visibleCountries.map((country) => {
                const offices = officesFor(country.code);
                const active = country.active !== false;
                return (
                  <div
                    key={country.code}
                    className={`rounded-md border border-border/60 p-3 ${active ? "" : "bg-muted/40"}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <CountryFlag code={country.code} className="h-4 w-6 rounded-sm" />
                        {country.name} ({country.code})
                      </p>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          {t("activeInStore")}
                          <Switch
                            checked={active}
                            onCheckedChange={(checked) => update(country.code, { active: checked })}
                          />
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive"
                          onClick={() => setRemoving(country)}
                        >
                          {tCommon("remove")}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">{t("allowed")}</p>
                        <div className="flex flex-wrap gap-2">
                          {currencies.map((code) => (
                            <label key={`${country.code}-${code}`} className="flex items-center gap-1 text-xs">
                              <Checkbox
                                checked={country.currencies.includes(code)}
                                onCheckedChange={(checked) => {
                                  const set = new Set(country.currencies);
                                  if (checked === true) set.add(code);
                                  else set.delete(code);
                                  const nextList = Array.from(set);
                                  update(country.code, {
                                    currencies: nextList,
                                    defaultCurrency: nextList.includes(country.defaultCurrency)
                                      ? country.defaultCurrency
                                      : (nextList[0] ?? ""),
                                  });
                                }}
                                aria-label={t("toggleAria", { code, country: country.name })}
                              />
                              {code}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">{t("defaultCurrency")}</p>
                        <Select
                          value={country.defaultCurrency}
                          onValueChange={(next) => next && update(country.code, { defaultCurrency: next })}
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder={t("selectCurrency")} />
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
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">{t("primaryOffice")}</p>
                        {offices.length === 0 ? (
                          <p className="flex h-9 items-center text-xs text-muted-foreground">
                            {t("noOffice")}
                          </p>
                        ) : (
                          <Select
                            value={country.primaryOfficeId ?? NO_OFFICE}
                            onValueChange={(next) =>
                              update(country.code, {
                                primaryOfficeId: next && next !== NO_OFFICE ? next : undefined,
                              })
                            }
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue placeholder={t("selectOffice")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NO_OFFICE}>{t("automaticOffice")}</SelectItem>
                              {offices.map((office) => (
                                <SelectItem key={office.id} value={office.id}>
                                  {office.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addCountry")}</DialogTitle>
            <DialogDescription>{t("addCountryHint")}</DialogDescription>
          </DialogHeader>
          <Input
            value={addQuery}
            onChange={(event) => setAddQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
          />
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {addable.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("noCountries")}</p>
            )}
            {addable.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => addCountry(country.code, country.name)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-oboya-soft-white"
              >
                <CountryFlag code={country.code} className="h-4 w-6 rounded-sm" />
                {country.name} ({country.code})
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("removeTitle", { country: removing?.name ?? "" })}</DialogTitle>
            <DialogDescription>
              {t("removeBody", { count: productCounts[removing?.code ?? ""] ?? 0 })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>
              {tCommon("cancel")}
            </Button>
            <Button
              className="bg-oboya-orange text-white hover:bg-oboya-orange/90"
              onClick={() => {
                if (removing) {
                  setCountries((prev) => prev.filter((country) => country.code !== removing.code));
                  setDirty(true);
                }
                setRemoving(null);
              }}
            >
              {tCommon("remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EditorGuard dirty={dirty} saving={saving} onSave={() => void save()} />
    </Can>
  );
}
