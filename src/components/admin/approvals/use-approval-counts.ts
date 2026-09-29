"use client";

import { useCallback, useEffect, useState } from "react";
import { APPROVALS_CHANGED_EVENT } from "@/lib/cms/approvals/client";

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

export function useApprovalCounts() {
  const [counts, setCounts] = useState<ApprovalCounts>(EMPTY);

  const refresh = useCallback(() => {
    void fetchCounts().then((next) => {
      if (next) setCounts(next);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const handler = () => {
      void fetchCounts().then((next) => {
        if (next && !cancelled) setCounts(next);
      });
    };
    handler();
    window.addEventListener(APPROVALS_CHANGED_EVENT, handler);
    const timer = window.setInterval(handler, POLL_MS);
    return () => {
      cancelled = true;
      window.removeEventListener(APPROVALS_CHANGED_EVENT, handler);
      window.clearInterval(timer);
    };
  }, []);

  return { counts, refresh };
}
