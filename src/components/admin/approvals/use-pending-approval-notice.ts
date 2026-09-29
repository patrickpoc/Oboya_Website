"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { emitApprovalsChanged, readPendingApprovals } from "@/lib/cms/approvals/client";

/**
 * Returns a function that shows the "sent for approval" toast when an API
 * payload carries pending approvals. Returns true when something was held.
 */
export function usePendingApprovalNotice() {
  const t = useTranslations("admin.approvals");
  return useCallback(
    (payload: unknown, options?: { partial?: boolean }) => {
      const pending = readPendingApprovals(payload);
      if (pending.length === 0) return false;
      toast.info(options?.partial ? t("toast.partial") : t("toast.submitted"), {
        description: pending.map((p) => p.summary).filter(Boolean).join(" · ") || undefined,
      });
      emitApprovalsChanged();
      return true;
    },
    [t]
  );
}
