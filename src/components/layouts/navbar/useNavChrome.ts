"use client";

import { useEffect, useState } from "react";

export function usePastTransitionMarker(elementId = "hero") {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const update = () => {
      const el = document.getElementById(elementId);
      if (!el) {
        setPast(false);
        return;
      }
      // Mid-hero: solid nav when the hero's vertical center crosses the top
      const rect = el.getBoundingClientRect();
      setPast(rect.top + rect.height * 0.5 < 0);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [elementId]);

  return past;
}

/**
 * Storytelling → CMS handoff (mid-viewport), same moment the dark
 * timeline and the white Impact section meet on screen.
 * Bidirectional: light banner while continue intersects the upper half.
 */
export function useStoryExitHandoff(elementId: string) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const el = document.getElementById(elementId);
    if (!el) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the observed element is absent on this route
      setPast(false);
      return;
    }

    // Observation zone = top 50% of the viewport (handoff line in the screenshot)
    const observer = new IntersectionObserver(
      ([entry]) => {
        setPast(entry.isIntersecting);
      },
      { root: null, rootMargin: "0px 0px -50% 0px", threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [elementId]);

  return past;
}
