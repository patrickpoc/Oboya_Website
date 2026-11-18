"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Can } from "@/components/admin/permissions/Can";
import { PendingChangeBanner } from "@/components/admin/approvals/PendingChangeBanner";
import { usePendingApprovalNotice } from "@/components/admin/approvals/use-pending-approval-notice";
import { Button } from "@/components/ui/button";
import { withoutApprovalMeta } from "@/lib/cms/approvals/client";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";

/** Edits only homepage.globalPresence.showConnections; saves on toggle. */
export function MapConnectionsToggle() {
  const t = useTranslations("admin.website.home");
  const tCommon = useTranslations("admin.common");
  const [show, setShow] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const notifyPending = usePendingApprovalNotice();

  const load = useCallback(async () => {
    setLoadFailed(false);
    try {
      const res = await fetch("/api/cms/homepage");
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as HomepageSettings;
      if (!data?.hero) throw new Error("malformed");
      setShow(data.globalPresence.showConnections !== false);
      setLoaded(true);
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount; state updates happen after the awaited request
    void load();
  }, [load]);

  const onChange = async (checked: boolean) => {
    if (!loaded || saving) return;
    setSaving(true);
    try {
      // Re-fetch so only this flag changes on top of the latest document.
      const cur = await fetch("/api/cms/homepage");
      if (!cur.ok) throw new Error(tCommon("saveFailed"));
      const fresh = withoutApprovalMeta((await cur.json()) as HomepageSettings);
      if (!fresh?.hero) throw new Error(tCommon("saveFailed"));
      const next: HomepageSettings = {
        ...fresh,
        globalPresence: { ...fresh.globalPresence, showConnections: checked },
      };
      const res = await fetch("/api/cms/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = (await res.json()) as HomepageSettings & { error?: string };
      if (!res.ok) throw new Error(data.error ?? tCommon("saveFailed"));
      setShow(data.globalPresence.showConnections !== false);
      if (!notifyPending(data)) toast.success(t("saved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Can module="website" action="edit">
      <div className="mb-4 space-y-2">
        <PendingChangeBanner entityType="homepage" entityId="homepage" />
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="map-show-connections">{t("fields.showConnections")}</Label>
            <p className="text-sm text-muted-foreground">{t("fields.showConnectionsHint")}</p>
          </div>
          <div
            aria-disabled={!loaded || saving}
            className={!loaded || saving ? "pointer-events-none opacity-50" : undefined}
          >
            <Switch
              id="map-show-connections"
              checked={show}
              onCheckedChange={(checked) => void onChange(checked)}
            />
          </div>
        </div>
        {saving ? <p className="text-xs text-muted-foreground">{tCommon("saving")}</p> : null}
        {loadFailed ? (
          <p className="flex items-center gap-2 text-xs text-destructive">
            {tCommon("editorLoadFailed")}
            <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
              {tCommon("retry")}
            </Button>
          </p>
        ) : null}
      </div>
    </Can>
  );
}
