"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  TimelineBackground,
  type SlideDirection,
} from "@/components/timeline/TimelineBackground";
import { TimelineDescription } from "@/components/timeline/TimelineDescription";
import { TimelineYearsRail } from "@/components/timeline/TimelineYearsRail";
import { TimelineAtmosphere } from "@/components/timeline/TimelineAtmosphere";
import { useTimeline } from "@/hooks/useTimeline";
import { useScrollTimeline } from "@/hooks/useScrollTimeline";
import type { TimelineEvent } from "@/types/timeline";

interface TimelineLabels {
  prev: string;
  next: string;
  year: string;
  progressLabel: string;
  sectionLabel: string;
  discover: string;
  skip: string;
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

/**
 * Left year rail + hero banner image + centered copy below.
 * Wheel/arrows only change the year; slide is point-to-point (not scroll-scrubbed).
 */
export function Timeline({ events, labels }: TimelineProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const pinRef = useRef<HTMLElement | null>(null);
  const prevIndexRef = useRef(0);
  const directionRef = useRef<SlideDirection>("forward");
  const [scrollProgress, setScrollProgress] = useState(0);

  const { activeIndex, activeEvent, count, setActiveIndex } = useTimeline(events);

  if (activeIndex > prevIndexRef.current) directionRef.current = "forward";
  else if (activeIndex < prevIndexRef.current) directionRef.current = "back";
  const direction = directionRef.current;

  useEffect(() => {
    prevIndexRef.current = activeIndex;
  }, [activeIndex]);

  const { scrollToIndex, releaseToNextSection } = useScrollTimeline({
    count,
    enabled: !isMobile && !reducedMotion,
    reducedMotion,
    onIndexChange: setActiveIndex,
    onProgressChange: setScrollProgress,
    pinRef,
  });

  useEffect(() => {
    if (!isMobile && !reducedMotion) return;
    setScrollProgress(count <= 1 ? 0 : activeIndex / (count - 1));
  }, [isMobile, reducedMotion, activeIndex, count]);

  const goToIndex = useCallback(
    (index: number, dir?: SlideDirection) => {
      const next = Math.min(Math.max(index, 0), count - 1);
      if (next === activeIndex) return;

      directionRef.current = dir ?? (next > activeIndex ? "forward" : "back");

      if (isMobile || reducedMotion) {
        setActiveIndex(next);
        setScrollProgress(count <= 1 ? 0 : next / (count - 1));
        return;
      }

      scrollToIndex(next);
    },
    [activeIndex, count, isMobile, reducedMotion, setActiveIndex, scrollToIndex]
  );

  const handleSelect = useCallback(
    (index: number) => goToIndex(index),
    [goToIndex]
  );

  const handlePrev = useCallback(() => {
    if (activeIndex <= 0) return;
    goToIndex(activeIndex - 1, "back");
  }, [activeIndex, goToIndex]);

  const handleNext = useCallback(() => {
    if (activeIndex >= count - 1) {
      releaseToNextSection();
      return;
    }
    goToIndex(activeIndex + 1, "forward");
  }, [activeIndex, count, goToIndex, releaseToNextSection]);

  const handleSkip = useCallback(() => {
    releaseToNextSection();
  }, [releaseToNextSection]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }
      const pin = pinRef.current;
      if (!pin) return;
      const rect = pin.getBoundingClientRect();
      const inView = rect.top <= 80 && rect.bottom > window.innerHeight * 0.35;
      if (!inView) return;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        handleNext();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext, handlePrev]);

  if (!activeEvent) return null;

  const canPrev = activeIndex > 0;
  const isLastYear = activeIndex >= count - 1;

  return (
    <div className="relative bg-oboya-blue-dark">
      <TimelineAtmosphere />

      <section
        ref={pinRef}
        aria-label={labels.sectionLabel}
        className="relative z-10 flex min-h-svh overflow-hidden"
      >
        {/* Left — full-height year rail */}
        <div className="relative z-20 flex w-[5.5rem] shrink-0 flex-col border-r border-white/10 bg-oboya-blue-dark md:w-[6.25rem] lg:w-[6.75rem]">
          <TimelineYearsRail
            events={events}
            activeIndex={activeIndex}
            progress={scrollProgress}
            onSelect={handleSelect}
            onPrev={handlePrev}
            onNext={handleNext}
            canPrev={canPrev}
            isLastYear={isLastYear}
            labels={{ prev: labels.prev, next: labels.next }}
            className="h-full"
          />
        </div>

        {/* Main — hero banner + centered copy */}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <TimelineBackground
            events={events}
            activeIndex={activeIndex}
            direction={direction}
          />

          <div className="relative flex min-h-0 flex-[1] flex-col items-center justify-center overflow-hidden px-5 py-4 md:px-10 md:py-5 lg:px-14">
            <TimelineDescription
              event={activeEvent}
              labels={{ year: labels.year }}
              direction={direction}
            />
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="absolute right-4 bottom-5 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-oboya-blue-dark/70 px-3.5 py-2 text-xs font-semibold tracking-wide text-white/80 backdrop-blur-md transition-colors duration-200 hover:border-white/40 hover:bg-white/10 hover:text-white md:right-8 md:bottom-8 md:px-4 md:py-2.5 md:text-sm"
          >
            {labels.skip}
            <ChevronDown className="size-3.5 opacity-70" aria-hidden />
          </button>
        </div>

        <p className="sr-only" aria-live="polite">
          {labels.progressLabel}: {activeEvent.year} — {activeEvent.title}
          {activeIndex >= count - 1 ? `. ${labels.discover}` : ""}
        </p>
      </section>
    </div>
  );
}
