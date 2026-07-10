"use client";

import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/types/timeline";
import { getItemAngle } from "@/hooks/useTimelineRotation";

interface TimelineItemProps {
  event: TimelineEvent;
  index: number;
  count: number;
  activeIndex: number;
  radius: number;
  onSelect: (index: number) => void;
}

function shortestAngleDelta(a: number, b: number) {
  return ((a - b + 540) % 360) - 180;
}

/** Zero-size pivot on the rim so the dot center sits on the arc stroke. */
export function TimelineItem({
  event,
  index,
  count,
  activeIndex,
  radius,
  onSelect,
}: TimelineItemProps) {
  const angle = getItemAngle(index, count);
  const activeAngle = getItemAngle(activeIndex, count);
  const fromApex = Math.abs(shortestAngleDelta(angle, activeAngle));
  const step = count > 0 ? 360 / count : 0;
  const isActive = index === activeIndex;
  const isNeighbor = !isActive && fromApex <= step * 1.05;
  const visible = isActive || isNeighbor;

  return (
    <li
      className="absolute top-1/2 left-1/2 h-0 w-0"
      style={{
        transform: `rotate(${angle}deg) translate3d(0, -${radius}px, 0)`,
        willChange: "transform",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.4s ease",
      }}
      role="listitem"
    >
      <button
        type="button"
        onClick={() => onSelect(index)}
        aria-label={`${event.year}: ${event.title}`}
        aria-current={isActive ? "true" : undefined}
        tabIndex={visible ? 0 : -1}
        className={cn(
          "absolute left-0 top-0 flex w-max max-w-[7.5rem] -translate-x-1/2 flex-col items-center outline-none transition-transform duration-500 ease-out focus-visible:ring-2 focus-visible:ring-oboya-green/50",
          isActive ? "scale-100" : "scale-90 opacity-45 hover:opacity-75"
        )}
      >
        <span
          className={cn(
            "relative block shrink-0 -translate-y-1/2 rounded-full transition-all duration-500",
            isActive
              ? "size-3 bg-white shadow-[0_0_0_6px_rgba(77,175,78,0.55),0_0_18px_rgba(77,175,78,0.4)]"
              : "size-2 bg-white/85"
          )}
        />
        <span
          className={cn(
            "mt-1.5 whitespace-nowrap text-sm font-semibold tracking-wide md:text-base",
            isActive ? "text-white" : "text-white/65"
          )}
        >
          {event.year}
        </span>
      </button>
    </li>
  );
}
