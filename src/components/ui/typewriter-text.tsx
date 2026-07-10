"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export interface TypewriterSegment {
  text: string;
  className?: string;
  /** Insert a line break before this segment */
  breakBefore?: boolean;
}

interface TypewriterTextProps {
  segments: TypewriterSegment[];
  active?: boolean;
  duration?: number;
  className?: string;
}

export function TypewriterText({
  segments,
  active = false,
  duration = 4.2,
  className,
}: TypewriterTextProps) {
  const lines = useMemo(
    () =>
      segments.map((segment, index) => ({
        ...segment,
        text: segment.text,
        breakBefore: segment.breakBefore ?? index > 0,
      })),
    [segments]
  );
  const totalChars = useMemo(
    () => lines.reduce((sum, segment) => sum + segment.text.length, 0),
    [lines]
  );
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    if (!active) {
      setVisibleChars(0);
      return;
    }

    const durationMs = duration * 1000;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 2.2);
      setVisibleChars(Math.round(eased * totalChars));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [active, duration, totalChars]);

  let consumed = 0;

  return (
    <span className={cn("inline", className)}>
      {lines.map((segment, index) => {
        const lineStart = consumed;
        consumed += segment.text.length;
        const lineVisible = Math.max(
          0,
          Math.min(segment.text.length, visibleChars - lineStart)
        );

        if (lineVisible <= 0) return null;

        const isCurrent =
          visibleChars > lineStart && visibleChars < consumed && active;

        return (
          <span key={index}>
            {segment.breakBefore ? <br /> : null}
            <span className={segment.className}>
              {segment.text.slice(0, lineVisible)}
              {isCurrent && (
                <span
                  className="ml-0.5 inline-block h-[0.85em] w-[2px] animate-pulse bg-oboya-green align-middle"
                  aria-hidden
                />
              )}
            </span>
          </span>
        );
      })}
    </span>
  );
}
