"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  TimelineBackground,
  type SlideDirection,
} from "@/components/timeline/TimelineBackground";
import { TimelineCircle } from "@/components/timeline/TimelineCircle";
import { TimelineDescription } from "@/components/timeline/TimelineDescription";
import { TimelineProgress } from "@/components/timeline/TimelineProgress";
import { useTimeline } from "@/hooks/useTimeline";
import { useScrollTimeline } from "@/hooks/useScrollTimeline";
import {
  getContainerRotation,
  getRotationFromProgress,
} from "@/hooks/useTimelineRotation";
import type { TimelineEvent } from "@/types/timeline";

interface TimelineLabels {
  prev: string;
  next: string;
  year: string;
  progressLabel: string;
  sectionLabel: string;
  discover: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  labels: TimelineLabels;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function wrapIndex(index: number, count: number) {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

export function Timeline({ events, labels }: TimelineProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const pinRef = useRef<HTMLElement | null>(null);
  const circleRef = useRef<HTMLDivElement | null>(null);
  const prevIndexRef = useRef(0);
  const directionRef = useRef<SlideDirection>("forward");

  const { activeIndex, activeEvent, count, setActiveIndex } = useTimeline(events);

  if (activeIndex > prevIndexRef.current) directionRef.current = "forward";
  else if (activeIndex < prevIndexRef.current) directionRef.current = "back";
  const direction = directionRef.current;

  useEffect(() => {
    prevIndexRef.current = activeIndex;
  }, [activeIndex]);

  const { scrollToIndex } = useScrollTimeline({
    count,
    enabled: !isMobile && !reducedMotion,
    reducedMotion,
    onIndexChange: setActiveIndex,
    circleRef,
    pinRef,
  });

  const animateCircleToIndex = useCallback(
    (index: number, fromIndex: number, dir: SlideDirection) => {
      if (!circleRef.current || count <= 0) return;
      const step = 360 / count;
      const duration = reducedMotion ? 0.15 : 0.85;
      const fromRot = getContainerRotation(fromIndex, count);

      // Loop forward: last → first (keep spinning the same way, then normalize)
      if (dir === "forward" && fromIndex === count - 1 && index === 0) {
        gsap.to(circleRef.current, {
          rotate: fromRot - step,
          duration,
          ease: "power3.out",
          force3D: true,
          onComplete: () => {
            if (circleRef.current) gsap.set(circleRef.current, { rotate: 0, force3D: true });
          },
        });
        return;
      }

      // Loop back: first → last
      if (dir === "back" && fromIndex === 0 && index === count - 1) {
        gsap.to(circleRef.current, {
          rotate: fromRot + step,
          duration,
          ease: "power3.out",
          force3D: true,
          onComplete: () => {
            if (circleRef.current) {
              gsap.set(circleRef.current, {
                rotate: getContainerRotation(count - 1, count),
                force3D: true,
              });
            }
          },
        });
        return;
      }

      gsap.to(circleRef.current, {
        rotate: getContainerRotation(index, count),
        duration,
        ease: "power3.out",
        force3D: true,
      });
    },
    [count, reducedMotion]
  );

  const goToIndex = useCallback(
    (index: number, dir?: SlideDirection) => {
      const next = wrapIndex(index, count);
      const from = activeIndex;
      if (next === from) return;

      const slideDir: SlideDirection =
        dir ?? (next > from || (from === count - 1 && next === 0) ? "forward" : "back");

      // Explicit wrap directions (index math alone is ambiguous)
      if (from === count - 1 && next === 0) directionRef.current = "forward";
      else if (from === 0 && next === count - 1) directionRef.current = "back";
      else directionRef.current = slideDir;

      const isWrap =
        (from === count - 1 && next === 0) || (from === 0 && next === count - 1);

      if (isMobile || reducedMotion || isWrap) {
        setActiveIndex(next);
        animateCircleToIndex(next, from, directionRef.current);
        if (!isMobile && !reducedMotion && isWrap) {
          // Sync pin scroll without scrubbing through intermediate years
          scrollToIndex(next, { immediate: true, skipCircle: true });
        }
        return;
      }

      scrollToIndex(next);
    },
    [
      activeIndex,
      count,
      isMobile,
      reducedMotion,
      setActiveIndex,
      animateCircleToIndex,
      scrollToIndex,
    ]
  );

  const handleSelect = useCallback(
    (index: number) => {
      goToIndex(index);
    },
    [goToIndex]
  );

  const handlePrev = useCallback(() => {
    goToIndex(activeIndex - 1, "back");
  }, [activeIndex, goToIndex]);

  const handleNext = useCallback(() => {
    goToIndex(activeIndex + 1, "forward");
  }, [activeIndex, goToIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        handleNext();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        handlePrev();
      } else if (event.key === "Home") {
        event.preventDefault();
        handleSelect(0);
      } else if (event.key === "End") {
        event.preventDefault();
        handleSelect(count - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext, handlePrev, handleSelect, count]);

  useEffect(() => {
    if (!circleRef.current) return;
    if (!isMobile && !reducedMotion) return;
    gsap.set(circleRef.current, {
      rotate: getRotationFromProgress(
        count <= 1 ? 0 : activeIndex / (count - 1),
        count
      ),
      force3D: true,
    });
  }, [isMobile, reducedMotion, activeIndex, count]);

  if (!activeEvent) return null;

  return (
    <div className="relative min-h-svh bg-oboya-blue-dark">
      <TimelineBackground
        events={events}
        activeIndex={activeIndex}
        direction={direction}
      />

      <section
        ref={pinRef}
        aria-label={labels.sectionLabel}
        className="relative z-10 flex min-h-svh flex-col"
      >
        <div className="flex flex-1 flex-col justify-center overflow-x-clip pb-6 pt-16 md:pb-8 md:pt-20">
          <TimelineCircle
            events={events}
            activeIndex={activeIndex}
            circleRef={circleRef}
            onSelect={handleSelect}
            footer={
              <TimelineProgress
                events={events}
                activeIndex={activeIndex}
                onSelect={handleSelect}
                onPrev={handlePrev}
                onNext={handleNext}
                canPrev={count > 1}
                canNext={count > 1}
                labels={{ prev: labels.prev, next: labels.next }}
              />
            }
          >
            <TimelineDescription
              event={activeEvent}
              labels={{ year: labels.year }}
            />
          </TimelineCircle>
        </div>

        <p className="sr-only" aria-live="polite">
          {labels.progressLabel}: {activeEvent.year} — {activeEvent.title}
        </p>
      </section>
    </div>
  );
}
