"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TimelineEvent } from "@/types/timeline";
import { TimelineItem } from "@/components/timeline/TimelineItem";

interface TimelineCircleProps {
  events: TimelineEvent[];
  activeIndex: number;
  circleRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (index: number) => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

/**
 * Full-bleed arc matching mock proportions: tall bowl under transparent nav,
 * endpoints at page edges, copy + scrubber inside.
 */
export function TimelineCircle({
  events,
  activeIndex,
  circleRef,
  onSelect,
  children,
  footer,
}: TimelineCircleProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const update = () => setWidth(frame.clientWidth || window.innerWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const metrics = useMemo(() => {
    const w = Math.max(width, 320);
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;

    // Mock proportion: arc fills most of the viewport under the nav
    const apexPad = Math.max(vh * 0.1, 56);
    const frameHeight = Math.min(Math.max(vh * 0.72, 420), 720);
    const rise = Math.max(frameHeight - apexPad, 200);

    const radius = (rise * rise + (w / 2) * (w / 2)) / (2 * rise);
    const alphaRad = Math.acos(Math.max(0, (radius - rise) / radius));
    const alpha = (alphaRad * 180) / Math.PI;
    const cx = w / 2;
    const cy = apexPad + radius;

    return { width: w, height: frameHeight, radius, apexPad, cx, cy, alpha };
  }, [width]);

  const { height, radius, cx, cy, alpha } = metrics;
  const diameter = radius * 2;
  const arcPath = describeArc(cx, cy, radius, -alpha, alpha);

  return (
    <div
      ref={frameRef}
      className="relative w-full overflow-x-clip overflow-y-visible"
      style={{ height }}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${metrics.width} ${height}`}
        width={metrics.width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <path
          d={arcPath}
          fill="none"
          stroke="rgba(255,255,255,0.42)"
          strokeWidth={1.2}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
      </svg>

      <div
        className="pointer-events-none absolute left-1/2"
        style={{
          width: diameter,
          height: diameter,
          top: cy,
          transform: "translate3d(-50%, -50%, 0)",
        }}
      >
        <div
          ref={circleRef}
          className="pointer-events-auto absolute inset-0 will-change-transform"
          style={{ transform: "translate3d(0,0,0) rotate(0deg)" }}
        >
          <ul role="list" className="absolute inset-0 m-0 list-none p-0">
            {events.map((event, index) => (
              <TimelineItem
                key={event.id}
                event={event}
                index={index}
                count={events.length}
                activeIndex={activeIndex}
                radius={radius}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </div>
      </div>

      <div className="absolute inset-x-0 top-[26%] bottom-[8%] z-10 flex flex-col items-center justify-center px-4 md:top-[28%] md:bottom-[10%]">
        <div className="pointer-events-auto w-full max-w-lg shrink-0">
          {children}
        </div>
        {footer ? (
          <div className="pointer-events-auto mt-8 w-full max-w-md shrink-0 md:mt-10">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
