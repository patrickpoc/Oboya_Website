"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const URL_FILTERS_EVENT = "admin:url-filters";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(URL_FILTERS_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(URL_FILTERS_EVENT, callback);
  };
}

const getSnapshot = () => window.location.search;
const getServerSnapshot = () => "";

/**
 * Filters mirrored in the query string (shareable, survive reloads). Uses
 * history.replaceState so filter changes don't trigger a route transition.
 */
export function useUrlFilters<T extends Record<string, string>>(defaults: T) {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const values = useMemo(() => {
    const params = new URLSearchParams(search);
    const next = { ...defaults };
    for (const key of Object.keys(defaults) as Array<keyof T>) {
      const raw = params.get(String(key));
      if (raw !== null) next[key] = raw as T[keyof T];
    }
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- defaults are static literals per page
  }, [search]);

  const setFilters = useCallback(
    (patch: Partial<T>) => {
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "" || value === defaults[key]) params.delete(key);
        else params.set(key, String(value));
      }
      const query = params.toString();
      const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
      window.history.replaceState(window.history.state, "", url);
      window.dispatchEvent(new Event(URL_FILTERS_EVENT));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const reset = useCallback(() => setFilters(defaults), [setFilters, defaults]);

  return { filters: values, setFilters, reset };
}
