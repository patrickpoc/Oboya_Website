"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  getActiveIndexFromProgress,
  getRotationFromProgress,
} from "@/hooks/useTimelineRotation";

gsap.registerPlugin(ScrollTrigger);

interface UseScrollTimelineOptions {
  count: number;
  enabled: boolean;
  reducedMotion: boolean;
  onIndexChange: (index: number) => void;
  circleRef: React.RefObject<HTMLElement | null>;
  pinRef: React.RefObject<HTMLElement | null>;
}

export function useScrollTimeline({
  count,
  enabled,
  reducedMotion,
  onIndexChange,
  circleRef,
  pinRef,
}: UseScrollTimelineOptions) {
  const lenisRef = useRef<Lenis | null>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;
  const lastIndexRef = useRef(-1);
  const suppressCircleSyncRef = useRef(false);

  useEffect(() => {
    if (!enabled || count <= 0) return;

    const pin = pinRef.current;
    const circle = circleRef.current;
    if (!pin || !circle) return;

    const initialRotation = getRotationFromProgress(0, count);
    gsap.set(circle, { rotate: initialRotation, force3D: true });

    if (reducedMotion) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    const scrollDistance = Math.max(count - 1, 1) * window.innerHeight;
    const snapIncrement = count <= 1 ? 1 : 1 / (count - 1);

    const trigger = ScrollTrigger.create({
      trigger: pin,
      start: "top top",
      end: () => `+=${scrollDistance}`,
      pin: true,
      scrub: 0.9,
      anticipatePin: 1,
      snap: {
        snapTo: snapIncrement,
        duration: { min: 0.3, max: 0.85 },
        ease: "power3.inOut",
        inertia: false,
      },
      onUpdate: (self) => {
        if (!suppressCircleSyncRef.current) {
          const rotation = getRotationFromProgress(self.progress, count);
          gsap.set(circle, {
            rotate: rotation,
            force3D: true,
          });
        }

        const nextIndex = getActiveIndexFromProgress(self.progress, count);
        if (nextIndex !== lastIndexRef.current) {
          lastIndexRef.current = nextIndex;
          onIndexChangeRef.current(nextIndex);
        }
      },
    });

    triggerRef.current = trigger;
    ScrollTrigger.refresh();

    return () => {
      trigger.kill();
      triggerRef.current = null;
      gsap.ticker.remove(ticker);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [count, enabled, reducedMotion, circleRef, pinRef]);

  const scrollToIndex = (
    index: number,
    options?: { immediate?: boolean; skipCircle?: boolean }
  ) => {
    const clamped = Math.min(Math.max(index, 0), Math.max(count - 1, 0));
    const trigger = triggerRef.current;
    const lenis = lenisRef.current;
    const progress = count <= 1 ? 0 : clamped / (count - 1);
    const immediate = options?.immediate ?? false;
    const skipCircle = options?.skipCircle ?? false;

    onIndexChangeRef.current(clamped);
    lastIndexRef.current = clamped;

    if (skipCircle) {
      suppressCircleSyncRef.current = true;
      window.setTimeout(() => {
        suppressCircleSyncRef.current = false;
      }, 900);
    }

    if (!skipCircle && circleRef.current && (reducedMotion || !trigger || immediate)) {
      if (immediate) {
        gsap.set(circleRef.current, {
          rotate: getRotationFromProgress(progress, count),
          force3D: true,
        });
      } else {
        gsap.to(circleRef.current, {
          rotate: getRotationFromProgress(progress, count),
          duration: reducedMotion ? 0.2 : 0.85,
          ease: "power3.out",
          force3D: true,
        });
      }
    }

    if (!trigger) return;

    const targetY = trigger.start + (trigger.end - trigger.start) * progress;

    if (immediate) {
      if (lenis && !reducedMotion) {
        lenis.scrollTo(targetY, { immediate: true });
      } else if (typeof window !== "undefined") {
        window.scrollTo({ top: targetY, behavior: "auto" });
      }
      return;
    }

    if (lenis && !reducedMotion) {
      lenis.scrollTo(targetY, { duration: 1 });
    } else if (typeof window !== "undefined") {
      window.scrollTo({ top: targetY, behavior: reducedMotion ? "auto" : "smooth" });
    }
  };

  return { scrollToIndex };
}
