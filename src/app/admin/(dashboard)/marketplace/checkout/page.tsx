"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EditorGuard, ErrorState, FormSkeleton } from "@/components/admin/common";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { CheckoutPageForm } from "@/components/admin/marketplace/checkout/CheckoutPageForm";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";
import { Can } from "@/components/admin/permissions/Can";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_CHECKOUT_PAGE,
  normalizeCheckoutPage,
  validateCheckoutPageForSave,
} from "@/lib/cms/checkout-page/defaults";
import type { CheckoutPageSettings } from "@/lib/cms/checkout-page/types";

export default function Page() {
  const t = useTranslations("admin.checkout");
  const tCommon = useTranslations("admin.common");
  const [settings, setSettings] = useState<CheckoutPageSettings>(DEFAULT_CHECKOUT_PAGE);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const response = await fetch("/api/cms/marketplace/checkout?forEdit=1", { cache: "no-store" });
      if (!response.ok) throw new Error(t("loadFailed"));
      setSettings(normalizeCheckoutPage((await response.json()) as CheckoutPageSettings));
    } catch {
      // Never fall back to defaults: saving them would overwrite the real page.
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
    const normalized = normalizeCheckoutPage(settings);
    const validationError = validateCheckoutPageForSave(normalized);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/cms/marketplace/checkout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
      });
      const payload = (await response.json().catch(() => null)) as
        | CheckoutPageSettings
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          payload && "error" in payload && payload.error ? payload.error : t("saveFailed")
        );
      }
      setSettings(normalizeCheckoutPage(payload));
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
      <p className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link className="text-oboya-blue-light hover:underline" href="/admin/marketplace/checkout/freight">
          {t("freightTitle")}
        </Link>
        <Link className="text-oboya-blue-light hover:underline" href="/admin/marketplace/checkout/coupons">
          {t("couponsTitle")}
        </Link>
        <Link className="text-oboya-blue-light hover:underline" href="/admin/marketplace/checkout/payments">
          {t("paymentsTitle")}
        </Link>
      </p>
      {loading ? (
        <FormSkeleton />
      ) : loadFailed ? (
        <ErrorState message={tCommon("editorLoadFailed")} onRetry={() => void load()} />
      ) : (
        <CheckoutPageForm value={settings} onChange={setSettings} />
      )}
      <EditorGuard dirty={!loading && !loadFailed} saving={saving} onSave={() => void save()} />
    </Can>
  );
}
