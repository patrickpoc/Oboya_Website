"use client";

import { useCallback, useEffect, useState } from "react";

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

export function useLeadCounts() {
  const [counts, setCounts] = useState<LeadCounts>(EMPTY);

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
    window.addEventListener(LEADS_CHANGED_EVENT, handler);
    const timer = window.setInterval(handler, POLL_MS);
    return () => {
      cancelled = true;
      window.removeEventListener(LEADS_CHANGED_EVENT, handler);
      window.clearInterval(timer);
    };
  }, []);

  return { counts, refresh };
}
