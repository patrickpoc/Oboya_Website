"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { useInView } from "framer-motion";
import { useHomeIntro } from "@/components/layout/HomeIntroGate";

export const OPENING_MS = 3000;
export const STAGE_MS = 6000;
export const CLOSING_MS = 6000;
export const HOLD_MS = 12000;

// Phases: -1 idle (not started), 0 opening, 1..N stages, N+1 closing, N+2 hold (then back to 0).
const IDLE = -1;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** Live reduced-motion setting: updates mid-session, false on the server and first client render. */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/** Static = reduced motion or CMS animations off. */
export function useEcosystemStatic(animationsEnabled: boolean) {
  const reduce = usePrefersReducedMotion();
  return animationsEnabled === false || reduce;
}

export type EcoPhaseKind = "static" | "idle" | "opening" | "stage" | "closing" | "hold";

/**
 * The ecosystem sequence: one phase at a time, advanced by the CSS clock (`advance`),
 * paused by hover, visibility, scrolling away or the user. Selecting a step stops autoplay.
 * Static mode has no timers: a stage is always selected and the rail still navigates.
 */
export function useEcosystemSequence({
  count,
  isStatic,
  ref,
}: {
  count: number;
  isStatic: boolean;
  ref: RefObject<HTMLElement | null>;
}) {
  const inView = useInView(ref, { amount: 0.3 });
  const unlocked = useHomeIntro()?.isUnlocked ?? true;
  const [rawPhase, setPhase] = useState(IDLE);
  const [launched, setLaunched] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);

  const CLOSING = count + 1;
  const HOLD = count + 2;

  // First start waits for the stage in view and the loading overlay gone; later returns just resume.
  if (!launched && !isStatic && inView && unlocked) setLaunched(true);
  // Static mode and idle before launch both show the first stage.
  const phase = isStatic ? (rawPhase >= 1 && rawPhase <= count ? rawPhase : 1) : rawPhase === IDLE && launched ? 0 : rawPhase;

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const kind: EcoPhaseKind = isStatic
    ? "static"
    : phase < 0
      ? "idle"
      : phase === 0
        ? "opening"
        : phase <= count
          ? "stage"
          : phase === CLOSING
            ? "closing"
            : "hold";
  const stageIndex = phase >= 1 && phase <= count ? phase - 1 : isStatic ? 0 : -1;
  const running = !isStatic && launched && !hidden && inView && !userPaused && !hoverPaused;
  const phaseMs = phase === 0 ? OPENING_MS : phase === CLOSING ? CLOSING_MS : phase === HOLD ? HOLD_MS : STAGE_MS;

  const advance = () => setPhase(phase === HOLD ? 0 : phase + 1);
  const select = (i: number) => {
    setPhase(i + 1);
    if (!isStatic) setUserPaused(true);
  };
  const toggle = () => {
    if (!launched) setLaunched(true);
    setUserPaused((p) => !p);
  };

  return {
    phase,
    kind,
    stageIndex,
    running,
    playState: (running ? "running" : "paused") as "running" | "paused",
    phaseMs,
    autoplay: !isStatic && !userPaused,
    userPaused,
    advance,
    select,
    toggle,
    setHoverPaused,
  };
}
