"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TransitionEvent,
} from "react";
import { cn } from "@/lib/utils";

interface HomeIntroContextValue {
  /** Call once when hero media (video/image) is ready to show. */
  markHeroReady: () => void;
  isUnlocked: boolean;
}

const HomeIntroContext = createContext<HomeIntroContextValue | null>(null);

export function useHomeIntro() {
  return useContext(HomeIntroContext);
}

interface HomeIntroGateProps {
  children: ReactNode;
  /** When false, hero readiness is satisfied immediately. */
  waitForHero?: boolean;
}

const UNLOCK_TIMEOUT_MS = 5000;

export function HomeIntroGate({
  children,
  waitForHero = true,
}: HomeIntroGateProps) {
  const [heroReady, setHeroReady] = useState(!waitForHero);
  const [gone, setGone] = useState(false);
  const heroMarked = useRef(!waitForHero);

  const markHeroReady = useCallback(() => {
    if (heroMarked.current) return;
    heroMarked.current = true;
    setHeroReady(true);
  }, []);

  useEffect(() => {
    if (!waitForHero) {
      heroMarked.current = true;
      queueMicrotask(() => setHeroReady(true));
    }
  }, [waitForHero]);

  useEffect(() => {
    if (!waitForHero) return;

    const timeout = window.setTimeout(markHeroReady, UNLOCK_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [waitForHero, markHeroReady]);

  const ready = heroReady;

  useEffect(() => {
    if (gone) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [gone]);

  const onOverlayTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== "opacity") return;
    if (!ready) return;
    setGone(true);
  };

  const value = useMemo<HomeIntroContextValue>(
    () => ({
      markHeroReady,
      isUnlocked: gone,
    }),
    [markHeroReady, gone]
  );

  return (
    <HomeIntroContext.Provider value={value}>
      {children}
      {!gone ? (
        <div
          className={cn(
            "fixed inset-0 z-[200] flex items-center justify-center bg-oboya-blue-dark transition-opacity duration-[400ms] ease-out",
            ready ? "pointer-events-none opacity-0" : "opacity-100"
          )}
          aria-busy={!ready}
          aria-live="polite"
          role="status"
          onTransitionEnd={onOverlayTransitionEnd}
        >
          <span className="sr-only">Loading</span>
          <span
            className="size-11 animate-spin rounded-full border-2 border-white/20 border-t-oboya-green md:size-12"
            aria-hidden
          />
        </div>
      ) : null}
    </HomeIntroContext.Provider>
  );
}
