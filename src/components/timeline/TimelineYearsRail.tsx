"use client";

import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/types/timeline";

interface TimelineYearsRailProps {
  events: TimelineEvent[];
  activeIndex: number;
  progress: number;
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  isLastYear: boolean;
  labels: {
    prev: string;
    next: string;
  };
  className?: string;
}

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <path
        d="M3.5 10.25 8 5.75l4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <path
        d="M3.5 5.75 8 10.25l4.5-4.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Full-height year rail — top to bottom on the left. */
export function TimelineYearsRail({
  events,
  activeIndex,
  progress,
  onSelect,
  onPrev,
  onNext,
  canPrev,
  isLastYear,
  labels,
  className,
}: TimelineYearsRailProps) {
  const count = events.length;
  const thumbPercent =
    count <= 1 ? 0 : Math.min(100, Math.max(0, progress * 100));

  return (
    <aside
      className={cn(
        "relative flex h-full min-h-0 w-full flex-col items-center",
        className
      )}
      aria-label="Timeline years"
    >
      {/* Clears fixed navbar (h-16 / md:h-20) */}
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label={labels.prev}
        className={cn(
          "relative z-20 mx-auto mb-4 flex size-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-oboya-blue-dark text-white transition-colors duration-200 hover:border-white/45 hover:bg-white/10 md:size-10",
          "mt-[4.75rem] md:mt-[5.5rem]",
          !canPrev &&
            "cursor-not-allowed border-white/10 bg-oboya-blue-dark/80 text-white/35 hover:border-white/10 hover:bg-oboya-blue-dark/80"
        )}
      >
        <ChevronUpIcon className="size-4" />
      </button>

      <div className="relative flex min-h-0 w-full flex-1 flex-col items-center px-1">
        <div
          className="pointer-events-none absolute top-1 bottom-1 left-1/2 w-px -translate-x-1/2 bg-white/20"
          aria-hidden
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1 left-1/2 w-px -translate-x-1/2 origin-top bg-oboya-green shadow-[0_0_10px_rgba(77,175,78,0.55)] transition-[height] duration-300 ease-out"
          style={{ height: `calc((100% - 0.5rem) * ${thumbPercent / 100})` }}
        />

        <ul className="relative z-10 flex h-full w-full flex-col items-center justify-between py-1">
          {events.map((event, index) => {
            const isActive = index === activeIndex;
            const isPast = index < activeIndex;

            return (
              <li key={event.id} className="relative flex w-full justify-center">
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  aria-label={`${event.year}: ${event.title}`}
                  aria-current={isActive ? "true" : undefined}
                  className="group relative flex flex-col items-center outline-none"
                >
                  <span
                    className={cn(
                      "relative z-10 block rounded-full transition-all duration-300 ease-out",
                      isActive
                        ? "size-3 bg-oboya-green shadow-[0_0_0_5px_rgba(77,175,78,0.28),0_0_14px_rgba(77,175,78,0.5)]"
                        : isPast
                          ? "size-2 bg-oboya-green/80"
                          : "size-2 bg-white/35 group-hover:bg-white/60"
                    )}
                  />

                  <span
                    className={cn(
                      "mt-1.5 whitespace-nowrap font-display text-[0.6875rem] font-semibold tabular-nums tracking-wide transition-all duration-300 ease-out md:text-xs",
                      isActive
                        ? "rounded-full bg-oboya-green px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_2px_10px_rgba(77,175,78,0.4)] md:text-[11px]"
                        : isPast
                          ? "text-white/55"
                          : "text-white/35 group-hover:text-white/60"
                    )}
                  >
                    {event.year}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        type="button"
        onClick={onNext}
        aria-label={labels.next}
        className={cn(
          "relative z-20 mx-auto mt-4 mb-6 flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 md:size-10",
          isLastYear
            ? "border-oboya-green/55 bg-oboya-green/15 text-oboya-green hover:border-oboya-green/70 hover:bg-oboya-green/25"
            : "border-white/25 bg-oboya-blue-dark text-white hover:border-white/45 hover:bg-white/10"
        )}
      >
        <ChevronDownIcon className="size-4" />
      </button>
    </aside>
  );
}
