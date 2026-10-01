"use client";

import { createSharedPoller } from "@/components/admin/common/shared-poll";

export const LEADS_CHANGED_EVENT = "oboya:leads-changed";

export type LeadCounts = { unread: number; open: number };
const EMPTY: LeadCounts = { unread: 0, open: 0 };
const POLL_MS = 60_000;

async function fetchCounts(): Promise<LeadCounts | null> {
  try {
    const res = await fetch("/api/cms/forms/count", {
      cache: "no-store",
      headers: { "x-admin-quiet": "1" },
    });
    if (!res.ok) return null;
    return { ...EMPTY, ...((await res.json()) as Partial<LeadCounts>) };
  } catch {
    return null;
  }
}

export function emitLeadsChanged() {
  window.dispatchEvent(new Event(LEADS_CHANGED_EVENT));
}

const poller = createSharedPoller({
  initial: EMPTY,
  fetch: fetchCounts,
  intervalMs: POLL_MS,
  refreshEvent: LEADS_CHANGED_EVENT,
});

export function useLeadCounts() {
  const { value, refresh } = poller.use();
  return { counts: value, refresh };
}
