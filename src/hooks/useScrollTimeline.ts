"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

interface UseScrollTimelineOptions {
  count: number;
  enabled: boolean;
  reducedMotion: boolean;
  onIndexChange: (index: number) => void;
  onProgressChange?: (progress: number) => void;
  pinRef: React.RefObject<HTMLElement | null>;
}

const STEP_LOCK_MS = 320;
const WHEEL_THRESHOLD = 12;

/**
 * Pins the timeline viewport.
 * Wheel / arrows change year without scrubbing.
 * Last year + scroll down → #about-continue.
 * Re-entering from below lands on the last year and resumes year navigation.
 */
export function useScrollTimeline({
  count,
  enabled,
  reducedMotion,
  onIndexChange,
  onProgressChange,
  pinRef,
}: UseScrollTimelineOptions) {
  const lenisRef = useRef<Lenis | null>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const onIndexChangeRef = useRef(onIndexChange);
  const onProgressChangeRef = useRef(onProgressChange);
  onIndexChangeRef.current = onIndexChange;
  onProgressChangeRef.current = onProgressChange;

  const indexRef = useRef(0);
  const lockRef = useRef(false);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countRef = useRef(count);
  countRef.current = count;
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;
  const releasingRef = useRef(false);
  /** Brief ignore after re-enter so entry wheel momentum doesn’t eject. */
  const reenterGuardRef = useRef(false);
  const reenterGuardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const setIndex = useCallback((index: number) => {
    const max = Math.max(countRef.current - 1, 0);
    const clamped = Math.min(Math.max(index, 0), max);
    indexRef.current = clamped;
    const progress = max <= 0 ? 0 : clamped / max;
    onIndexChangeRef.current(clamped);
    onProgressChangeRef.current?.(progress);
    return clamped;
  }, []);

  const lock = useCallback((ms = STEP_LOCK_MS) => {
    lockRef.current = true;
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => {
      lockRef.current = false;
      lockTimerRef.current = null;
    }, ms);
  }, []);

  const clearReenterGuard = useCallback(() => {
    reenterGuardRef.current = false;
    if (reenterGuardTimerRef.current) {
      clearTimeout(reenterGuardTimerRef.current);
      reenterGuardTimerRef.current = null;
    }
  }, []);

  const armReenterGuard = useCallback(() => {
    reenterGuardRef.current = true;
    if (reenterGuardTimerRef.current) clearTimeout(reenterGuardTimerRef.current);
    reenterGuardTimerRef.current = setTimeout(() => {
      reenterGuardRef.current = false;
      reenterGuardTimerRef.current = null;
    }, 450);
  }, []);

  const scrollToIndex = useCallback(
    (index: number, options?: { immediate?: boolean }) => {
      const clamped = setIndex(index);
      const atLast = clamped >= countRef.current - 1;
      if (atLast) {
        lockRef.current = false;
        if (lockTimerRef.current) {
          clearTimeout(lockTimerRef.current);
          lockTimerRef.current = null;
        }
        return;
      }
      lock(options?.immediate ? 80 : STEP_LOCK_MS);
    },
    [setIndex, lock]
  );

  const parkAtPinStart = useCallback(() => {
    const trigger = triggerRef.current;
    const lenis = lenisRef.current;
    if (!trigger) return;
    if (lenis && !reducedMotionRef.current) {
      lenis.scrollTo(trigger.start, { immediate: true });
      return;
    }
    window.scrollTo({ top: trigger.start, behavior: "auto" });
  }, []);

  const releaseToNextSection = useCallback(() => {
    if (releasingRef.current) return;
    releasingRef.current = true;
    clearReenterGuard();
    lockRef.current = false;
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }

    const lenis = lenisRef.current;
    const continueEl = document.getElementById("about-continue");
    const trigger = triggerRef.current;

    const finish = () => {
      releasingRef.current = false;
      ScrollTrigger.refresh();
    };

    // Past pin end cleanly so leave/enterBack cycle is reliable
    const pinExitY = trigger
      ? trigger.end + Math.round(window.innerHeight * 0.15)
      : window.scrollY + window.innerHeight;
    const continueY = continueEl
      ? continueEl.getBoundingClientRect().top +
        (window.scrollY || window.pageYOffset)
      : pinExitY;
    const targetY = Math.max(continueY, pinExitY);

    if (lenis && !reducedMotionRef.current) {
      lenis.scrollTo(targetY, {
        duration: 0.85,
        onComplete: finish,
      });
      window.setTimeout(finish, 1000);
      return;
    }

    window.scrollTo({
      top: targetY,
      behavior: reducedMotionRef.current ? "auto" : "smooth",
    });
    window.setTimeout(finish, 850);
  }, [clearReenterGuard]);

  const stepBy = useCallback(
    (direction: 1 | -1): boolean => {
      if (releasingRef.current) return true;

      // Ignore leftover wheel momentum right after re-entering the pin
      if (reenterGuardRef.current) return true;

      const n = countRef.current;
      const current = indexRef.current;
      const last = Math.max(n - 1, 0);

      if (direction > 0) {
        if (current >= last) {
          releaseToNextSection();
          return true;
        }
        if (lockRef.current) return true;
        scrollToIndex(current + 1);
        return true;
      }

      if (lockRef.current) return true;

      if (current <= 0) {
        return false; // allow natural leave upward
      }
      scrollToIndex(current - 1);
      return true;
    },
    [releaseToNextSection, scrollToIndex]
  );

  useEffect(() => {
    if (!enabled || count <= 0 || reducedMotion) return;

    const pin = pinRef.current;
    if (!pin) return;

    const lenis = new Lenis({
      duration: 0.9,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: false,
      syncTouch: false,
    });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    // Longer pin range so scrolling back from below reliably re-enters
    const trigger = ScrollTrigger.create({
      trigger: pin,
      start: "top top",
      end: () => `+=${Math.round(window.innerHeight)}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      onEnterBack: () => {
        releasingRef.current = false;
        const last = Math.max(countRef.current - 1, 0);
        setIndex(last);
        parkAtPinStart();
        armReenterGuard();
        ScrollTrigger.refresh();
      },
      onEnter: () => {
        releasingRef.current = false;
      },
    });

    triggerRef.current = trigger;
    ScrollTrigger.refresh();
    setIndex(indexRef.current);

    const onWheel = (event: WheelEvent) => {
      if (releasingRef.current) return;

      const activeTrigger = triggerRef.current;
      if (!activeTrigger?.isActive) return;

      if (
        Math.abs(event.deltaY) < WHEEL_THRESHOLD &&
        Math.abs(event.deltaX) < WHEEL_THRESHOLD
      ) {
        return;
      }

      const delta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;
      const direction: 1 | -1 = delta > 0 ? 1 : -1;

      // Re-enter settle: absorb momentum without leaving the pin
      if (reenterGuardRef.current) {
        event.preventDefault();
        event.stopPropagation();
        parkAtPinStart();
        return;
      }

      if (direction < 0 && indexRef.current <= 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const last = Math.max(countRef.current - 1, 0);
      const exitingDown = direction > 0 && indexRef.current >= last;
      if (!exitingDown) {
        parkAtPinStart();
      }

      stepBy(direction);
    };

    let touchStartY = 0;
    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0]?.clientY ?? 0;
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (releasingRef.current || reenterGuardRef.current) return;
      if (!triggerRef.current?.isActive) return;
      const endY = event.changedTouches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - endY;
      if (Math.abs(delta) < 40) return;
      const direction: 1 | -1 = delta > 0 ? 1 : -1;
      if (direction < 0 && indexRef.current <= 0) return;
      stepBy(direction);
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    pin.addEventListener("touchstart", onTouchStart, { passive: true });
    pin.addEventListener("touchend", onTouchEnd, { passive: true });

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("wheel", onWheel, true);
      pin.removeEventListener("touchstart", onTouchStart);
      pin.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", onResize);
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      clearReenterGuard();
      triggerRef.current?.kill();
      triggerRef.current = null;
      gsap.ticker.remove(ticker);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [
    count,
    enabled,
    reducedMotion,
    pinRef,
    setIndex,
    stepBy,
    parkAtPinStart,
    armReenterGuard,
    clearReenterGuard,
  ]);

  return { scrollToIndex, releaseToNextSection, stepBy };
}
