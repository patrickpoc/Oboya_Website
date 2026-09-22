"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type AdminLoadingContextValue = {
  /** True when the liquid-glass overlay should be visible */
  isLoading: boolean;
  /** Force overlay on immediately (navigation) */
  showNow: () => void;
  /** Clear a forced show when navigation settles */
  clearForced: () => void;
  begin: () => void;
  end: () => void;
};

const AdminLoadingContext = createContext<AdminLoadingContextValue | null>(null);

const SHOW_DELAY_MS = 100;
const HIDE_DELAY_MS = 160;

const QUIET_HEADER = "x-admin-quiet";

function shouldTrackRequest(input: RequestInfo | URL, init?: RequestInit): boolean {
  if (typeof window === "undefined") return false;
  if (!window.location.pathname.startsWith("/admin")) return false;

  const headers = new Headers(
    init?.headers || (input instanceof Request ? input.headers : undefined)
  );
  if (headers.get(QUIET_HEADER) === "1") return false;

  let url = "";
  if (typeof input === "string") url = input;
  else if (input instanceof URL) url = input.href;
  else if (input instanceof Request) url = input.url;

  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin) return false;
    return (
      (parsed.pathname.startsWith("/api/cms") &&
        !parsed.pathname.startsWith("/api/cms/media")) ||
      parsed.pathname.startsWith("/api/admin")
    );
  } catch {
    return false;
  }
}

export function AdminLoadingProvider({ children }: { children: React.ReactNode }) {
  const [depth, setDepth] = useState(0);
  const [forced, setForced] = useState(false);
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    showTimer.current = null;
    hideTimer.current = null;
  }, []);

  const busy = depth > 0 || forced;

  useEffect(() => {
    clearTimers();
    if (busy) {
      if (forced) {
        setVisible(true);
        return;
      }
      showTimer.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      return;
    }
    hideTimer.current = setTimeout(() => setVisible(false), HIDE_DELAY_MS);
    return clearTimers;
  }, [busy, forced, clearTimers]);

  const begin = useCallback(() => {
    setDepth((d) => d + 1);
  }, []);

  const end = useCallback(() => {
    setDepth((d) => Math.max(0, d - 1));
  }, []);

  const showNow = useCallback(() => {
    setForced(true);
    setVisible(true);
  }, []);

  const clearForced = useCallback(() => {
    setForced(false);
  }, []);

  // Intercept admin API fetches so every page gets the overlay without per-page wiring.
  useEffect(() => {
    const original = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const track = shouldTrackRequest(input, init);
      if (track) begin();
      try {
        return await original(input, init);
      } finally {
        if (track) end();
      }
    };

    return () => {
      window.fetch = original;
    };
  }, [begin, end]);

  const value = useMemo(
    () => ({
      isLoading: visible,
      showNow,
      clearForced,
      begin,
      end,
    }),
    [visible, showNow, clearForced, begin, end]
  );

  return (
    <AdminLoadingContext.Provider value={value}>{children}</AdminLoadingContext.Provider>
  );
}

export function useAdminLoading() {
  const ctx = useContext(AdminLoadingContext);
  if (!ctx) {
    throw new Error("useAdminLoading must be used within AdminLoadingProvider");
  }
  return ctx;
}

/** Keep the overlay visible for non-fetch work (immediate, no debounce). */
export function useReportAdminLoading(loading: boolean) {
  const { showNow, clearForced } = useAdminLoading();

  useEffect(() => {
    if (!loading) {
      clearForced();
      return;
    }
    showNow();
    return () => clearForced();
  }, [loading, showNow, clearForced]);
}
