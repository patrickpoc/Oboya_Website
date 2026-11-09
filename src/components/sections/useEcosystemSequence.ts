"use client";

import {
  useEffect,
  useReducer,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
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

export type EcoPhaseKind =
  "static" | "idle" | "opening" | "stage" | "closing" | "hold";

// ---- Pure state machine (unit-tested; the hook only wires it to React) ------------------
export type EcoState = {
  phase: number;
  launched: boolean;
  userPaused: boolean;
};
export type EcoAction =
  | { type: "launch" }
  | { type: "advance"; count: number }
  | { type: "select"; index: number; isStatic: boolean }
  | { type: "toggle" };

export const ECO_INITIAL: EcoState = {
  phase: IDLE,
  launched: false,
  userPaused: false,
};

export function ecoReducer(s: EcoState, a: EcoAction): EcoState {
  switch (a.type) {
    case "launch":
      return s.launched ? s : { ...s, launched: true };
    case "advance": {
      const hold = a.count + 2;
      const from = s.phase === IDLE ? 0 : s.phase;
      return { ...s, phase: from === hold ? 0 : from + 1 };
    }
    case "select":
      // Picking a step is a manual mode: autoplay stops (static mode has no autoplay to stop).
      return {
        ...s,
        phase: a.index + 1,
        userPaused: a.isStatic ? s.userPaused : true,
      };
    case "toggle":
      return { ...s, launched: true, userPaused: !s.userPaused };
  }
}

/** What the UI shows for a state: resolved phase, its kind, the stage index and the clock length. */
export function deriveEco(s: EcoState, count: number, isStatic: boolean) {
  const CLOSING = count + 1;
  const HOLD = count + 2;
  // Static mode always shows a stage; idle after launch shows the opening.
  const phase = isStatic
    ? s.phase >= 1 && s.phase <= count
      ? s.phase
      : 1
    : s.phase === IDLE && s.launched
      ? 0
      : s.phase;
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
  const stageIndex =
    phase >= 1 && phase <= count ? phase - 1 : isStatic ? 0 : -1;
  const phaseMs =
    phase === 0
      ? OPENING_MS
      : phase === CLOSING
        ? CLOSING_MS
        : phase === HOLD
          ? HOLD_MS
          : STAGE_MS;
  return { phase, kind, stageIndex, phaseMs };
}

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
  const [state, dispatch] = useReducer(ecoReducer, ECO_INITIAL);
  const [hidden, setHidden] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);

  // First start waits for the stage in view and the loading overlay gone; later returns just resume.
  if (!state.launched && !isStatic && inView && unlocked)
    dispatch({ type: "launch" });

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const { phase, kind, stageIndex, phaseMs } = deriveEco(
    state,
    count,
    isStatic,
  );
  const running =
    !isStatic &&
    state.launched &&
    !hidden &&
    inView &&
    !state.userPaused &&
    !hoverPaused;

  return {
    phase,
    kind,
    stageIndex,
    running,
    playState: (running ? "running" : "paused") as "running" | "paused",
    phaseMs,
    autoplay: !isStatic && !state.userPaused,
    userPaused: state.userPaused,
    advance: () => dispatch({ type: "advance", count }),
    select: (i: number) => dispatch({ type: "select", index: i, isStatic }),
    toggle: () => dispatch({ type: "toggle" }),
    setHoverPaused,
  };
}
