"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { ShopConfigForm } from "@/components/admin/marketplace/shop-config/ShopConfigForm";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";
import { Can } from "@/components/admin/permissions/Can";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DEFAULT_SHOP_CONFIG,
  normalizeShopConfig,
  validateShopConfigForSave,
} from "@/lib/cms/shop-config/defaults";
import type { ShopConfig } from "@/lib/cms/shop-config/types";
import type { ShopCountry } from "@/lib/shop/types";

export default function Page() {
  const t = useTranslations("admin.shopConfig");
  const tCommon = useTranslations("admin.common");
  const [config, setConfig] = useState<ShopConfig>(DEFAULT_SHOP_CONFIG);
  const [countries, setCountries] = useState<ShopCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const [configRes, currenciesRes] = await Promise.all([
          fetch("/api/cms/marketplace/shop-config", { cache: "no-store" }),
          fetch("/api/cms/marketplace/currencies", { cache: "no-store" }),
        ]);
        if (!configRes.ok) throw new Error(t("loadFailed"));
        const configJson = (await configRes.json()) as ShopConfig;
        const currenciesJson = currenciesRes.ok
          ? ((await currenciesRes.json()) as { countries?: ShopCountry[] })
          : { countries: [] };
        if (cancelled) return;
        setCountries(currenciesJson.countries ?? []);
        setConfig(
          normalizeShopConfig(configJson, {
            countries: currenciesJson.countries,
          })
        );
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : t("loadFailed"));
          setConfig(DEFAULT_SHOP_CONFIG);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

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
            disabled={loading || saving}
            className="rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
          >
            {saving ? tCommon("saving") : t("save")}
          </Button>
        }
      />
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t("loading")}
          </CardContent>
        </Card>
      ) : (
        <ShopConfigForm value={config} onChange={setConfig} countries={countries} />
      )}
    </Can>
  );
}
