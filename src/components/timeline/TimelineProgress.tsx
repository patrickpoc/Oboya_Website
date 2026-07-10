"use client";

import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/types/timeline";

interface TimelineProgressProps {
  events: TimelineEvent[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  labels: {
    prev: string;
    next: string;
  };
  className?: string;
}

/**
 * Compact scrubber: < | year pill on simple ticks | >
 */
export function TimelineProgress({
  events,
  activeIndex,
  onSelect,
  onPrev,
  onNext,
  canPrev,
  canNext,
  labels,
  className,
}: TimelineProgressProps) {
  const count = events.length;
  const bubblePercent = count <= 1 ? 0 : (activeIndex / (count - 1)) * 100;
  const activeYear = events[activeIndex]?.year ?? "";
  const tickCount = Math.max(count * 4, 20);

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-sm items-center gap-1 rounded-full border border-white/12 bg-white/8 px-1.5 py-1 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl md:max-w-md md:gap-1.5 md:px-2",
        className
      )}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label={labels.prev}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 md:size-9"
      >
        &lt;
      </button>

      <div className="relative mx-0.5 flex min-h-8 min-w-0 flex-1 items-center md:min-h-9">
        {/* Simple equal tick marks */}
        <div className="flex h-full w-full items-center justify-between px-1">
          {Array.from({ length: tickCount }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className="h-2.5 w-px bg-white/35 md:h-3"
            />
          ))}
        </div>

        {/* Year pill rides inside the tick track */}
        <div
          className="pointer-events-none absolute top-1/2 z-10 transition-[left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            left: `clamp(1.1rem, ${bubblePercent}%, calc(100% - 1.1rem))`,
            transform: "translate3d(-50%, -50%, 0)",
          }}
        >
          <span className="block rounded-full bg-oboya-green px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-[0_4px_14px_rgba(77,175,78,0.4)] md:px-2.5 md:text-[11px]">
            {activeYear}
          </span>
        </div>

        <div className="absolute inset-0 z-20 flex">
          {events.map((event, index) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`Go to ${event.year}`}
              aria-current={index === activeIndex ? "true" : undefined}
              className="h-full flex-1 rounded-sm outline-none focus-visible:bg-white/10"
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label={labels.next}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 md:size-9"
      >
        &gt;
      </button>
    </div>
  );
}
