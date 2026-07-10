"use client";

import { useCallback, useMemo, useState } from "react";
import type { TimelineEvent } from "@/types/timeline";

export function useTimeline(events: TimelineEvent[], initialIndex = 0) {
  const [activeIndex, setActiveIndex] = useState(
    Math.min(Math.max(initialIndex, 0), Math.max(events.length - 1, 0))
  );

  const count = events.length;
  const activeEvent = events[activeIndex] ?? events[0];

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      const next = ((index % count) + count) % count;
      setActiveIndex(next);
    },
    [count]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  const progress = useMemo(() => {
    if (count <= 1) return 0;
    return activeIndex / (count - 1);
  }, [activeIndex, count]);

  return {
    activeIndex,
    activeEvent,
    count,
    progress,
    goTo,
    goNext,
    goPrev,
    setActiveIndex,
  };
}

export type UseTimelineReturn = ReturnType<typeof useTimeline>;
