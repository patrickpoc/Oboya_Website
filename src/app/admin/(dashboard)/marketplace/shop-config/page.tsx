"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EditorGuard, ErrorState, FormSkeleton } from "@/components/admin/common";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { ShopConfigForm } from "@/components/admin/marketplace/shop-config/ShopConfigForm";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";
import { Can } from "@/components/admin/permissions/Can";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_SHOP_CONFIG,
  normalizeShopConfig,
  validateShopConfigForSave,
} from "@/lib/cms/shop-config/defaults";
import type { ShopConfig } from "@/lib/cms/shop-config/types";
import { filterActiveCountries } from "@/lib/cms/marketplace-countries";
import type { ShopCountry } from "@/lib/shop/types";

export default function Page() {
  const t = useTranslations("admin.shopConfig");
  const tCommon = useTranslations("admin.common");
  const [config, setConfig] = useState<ShopConfig>(DEFAULT_SHOP_CONFIG);
  // Full list (inactive included): normalizing against it keeps a default
  // market for an inactive country. The form only offers the active ones.
  const [countries, setCountries] = useState<ShopCountry[]>([]);
  const activeCountries = useMemo(() => filterActiveCountries(countries), [countries]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const [configRes, currenciesRes] = await Promise.all([
        fetch("/api/cms/marketplace/shop-config?forEdit=1", { cache: "no-store" }),
        fetch("/api/cms/marketplace/currencies?forEdit=1", { cache: "no-store" }),
      ]);
      // Both must succeed: a missing country list would clear the default market on save.
      if (!configRes.ok || !currenciesRes.ok) throw new Error(t("loadFailed"));
      const configJson = (await configRes.json()) as ShopConfig;
      const currenciesJson = (await currenciesRes.json()) as { countries?: ShopCountry[] };
      setCountries(currenciesJson.countries ?? []);
      setConfig(normalizeShopConfig(configJson, { countries: currenciesJson.countries }));
    } catch {
      // Never fall back to defaults: saving them would overwrite the real config.
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount; the loader sets loading state before awaiting the API
    void load();
  }, [load]);

  const save = async () => {
    const validationError = validateShopConfigForSave(config);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/cms/marketplace/shop-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const payload = (await response.json().catch(() => null)) as
        | ShopConfig
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          payload && "error" in payload && payload.error
            ? payload.error
            : t("saveFailed")
        );
      }
      setConfig(normalizeShopConfig(payload, { countries }));
      toast.success(t("saved"));
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
            type="button"
            onClick={() => void save()}
            disabled={loading || loadFailed || saving}
            className="rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
          >
            {saving ? tCommon("saving") : t("save")}
          </Button>
        }
      />
      {loading ? (
        <FormSkeleton />
      ) : loadFailed ? (
        <ErrorState message={tCommon("editorLoadFailed")} onRetry={() => void load()} />
      ) : (
        <ShopConfigForm value={config} onChange={setConfig} countries={activeCountries} />
      )}
      <EditorGuard dirty={!loading && !loadFailed} saving={saving} onSave={() => void save()} />
    </Can>
  );
}
