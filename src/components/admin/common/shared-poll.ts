"use client";

import { useEffect, useState } from "react";

type Poller<T> = {
  use: () => { value: T; refresh: () => void };
};

/**
 * One interval per endpoint no matter how many components subscribe, paused
 * while the tab is hidden and refreshed as soon as it becomes visible again.
 */
export function createSharedPoller<T>(options: {
  initial: T;
  fetch: () => Promise<T | null>;
  intervalMs: number;
  /** Window event that forces an immediate refresh. */
  refreshEvent?: string;
}): Poller<T> {
  let value = options.initial;
  const listeners = new Set<(next: T) => void>();
  let timer: number | null = null;
  let inFlight = false;

  const refresh = () => {
    if (inFlight) return;
    inFlight = true;
    void options
      .fetch()
      .then((next) => {
        if (next === null) return;
        value = next;
        listeners.forEach((listener) => listener(next));
      })
      .finally(() => {
        inFlight = false;
      });
  };

  const tick = () => {
    if (document.visibilityState === "visible") refresh();
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") refresh();
  };

  const start = () => {
    refresh();
    timer = window.setInterval(tick, options.intervalMs);
    document.addEventListener("visibilitychange", onVisibility);
    if (options.refreshEvent) window.addEventListener(options.refreshEvent, refresh);
  };

  const stop = () => {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    document.removeEventListener("visibilitychange", onVisibility);
    if (options.refreshEvent) window.removeEventListener(options.refreshEvent, refresh);
  };

  return {
    use() {
      const [current, setCurrent] = useState<T>(value);
      useEffect(() => {
        listeners.add(setCurrent);
        if (listeners.size === 1) start();
        else setCurrent(value);
        return () => {
          listeners.delete(setCurrent);
          if (listeners.size === 0) stop();
        };
      }, []);
      return { value: current, refresh };
    },
  };
}
