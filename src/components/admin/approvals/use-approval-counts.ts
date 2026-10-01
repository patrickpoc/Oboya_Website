"use client";

import { APPROVALS_CHANGED_EVENT } from "@/lib/cms/approvals/client";
import { createSharedPoller } from "@/components/admin/common/shared-poll";

export type ApprovalCounts = { approver: boolean; review: number; mine: number };

const EMPTY: ApprovalCounts = { approver: false, review: 0, mine: 0 };
const POLL_MS = 60_000;

async function fetchCounts(): Promise<ApprovalCounts | null> {
  try {
    const res = await fetch("/api/cms/change-requests/count", {
      cache: "no-store",
      headers: { "x-admin-quiet": "1" },
    });
    if (!res.ok) return null;
    return { ...EMPTY, ...((await res.json()) as Partial<ApprovalCounts>) };
  } catch {
    // Counts are best-effort.
    return null;
  }
}

const poller = createSharedPoller({
  initial: EMPTY,
  fetch: fetchCounts,
  intervalMs: POLL_MS,
  refreshEvent: APPROVALS_CHANGED_EVENT,
});

export function useApprovalCounts() {
  const { value, refresh } = poller.use();
  return { counts: value, refresh };
}
