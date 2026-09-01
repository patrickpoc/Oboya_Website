"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

/**
 * Keeps activeIndex in sync with native horizontal scroll on a snap track (mobile).
 * Does not call scrollIntoView — avoids hijacking vertical page scroll.
 */
export function useScrollSnapCarousel(
  trackRef: RefObject<HTMLElement | null>,
  itemCount: number,
  activeIndex: number,
  onActiveIndexChange: (index: number) => void,
  enabled: boolean
) {
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const programmaticScroll = useRef(false);

  useEffect(() => {
    if (!enabled || !trackRef.current || itemCount < 1) return;

    const track = trackRef.current;
    const children = Array.from(track.children) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        if (programmaticScroll.current) return;

        let bestIndex = activeIndexRef.current;
        let bestRatio = 0;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = children.indexOf(entry.target as HTMLElement);
          if (index < 0) continue;
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = index;
          }
        }

        if (bestRatio > 0 && bestIndex !== activeIndexRef.current) {
          onActiveIndexChange(bestIndex);
        }
      },
      {
        root: track,
        threshold: [0.5, 0.6, 0.7, 0.8, 0.9, 1],
      }
    );

    children.forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [enabled, itemCount, onActiveIndexChange, trackRef]);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const track = trackRef.current;
      if (!track || itemCount < 1) return;

      const child = track.children[index] as HTMLElement | undefined;
      if (!child) return;

      const targetLeft =
        child.offsetLeft - (track.clientWidth - child.clientWidth) / 2;
      const maxLeft = track.scrollWidth - track.clientWidth;
      const clampedLeft = Math.max(0, Math.min(targetLeft, maxLeft));

      if (Math.abs(track.scrollLeft - clampedLeft) < 2) return;

      programmaticScroll.current = true;
      track.scrollTo({ left: clampedLeft, behavior });
      window.setTimeout(() => {
        programmaticScroll.current = false;
      }, behavior === "smooth" ? 400 : 0);
    },
    [itemCount, trackRef]
  );

  return { scrollToIndex };
}
