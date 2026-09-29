"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ChangeRequest, ReviewDecision } from "@/lib/cms/approvals/types";
import { emitApprovalsChanged } from "@/lib/cms/approvals/client";

export function useChangeRequestActions(onDone?: (item: ChangeRequest) => void) {
  const t = useTranslations("admin.approvals.toast");
  const [busyId, setBusyId] = useState<string | null>(null);

  const post = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      setBusyId(id);
      try {
        const res = await fetch(`/api/cms/change-requests/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => null)) as {
          item?: ChangeRequest;
          error?: string;
        } | null;
        if (!res.ok || !data?.item) throw new Error(data?.error || t("failed"));
        const item = data.item;
        if (item.status === "approved") toast.success(t("approved"));
        else if (item.status === "rejected") toast.success(t("rejected"));
        else if (item.status === "in_review") toast.success(t("inReview"));
        else if (item.status === "cancelled") toast.success(t("cancelled"));
        else if (item.status === "conflict") toast.warning(t("conflict"));
        else if (item.status === "failed") toast.error(item.applyError || t("failed"));
        emitApprovalsChanged();
        onDone?.(item);
        return item;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("failed"));
        return null;
      } finally {
        setBusyId(null);
      }
    },
    [onDone, t]
  );

  const review = useCallback(
    (id: string, decision: ReviewDecision, options?: { comment?: string; force?: boolean }) =>
      post(id, { decision, ...options }),
    [post]
  );

  const cancel = useCallback((id: string) => post(id, { action: "cancel" }), [post]);

  return { review, cancel, busyId };
}
