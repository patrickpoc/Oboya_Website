"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import { cn } from "@/lib/utils";

interface AboutTimelineProps {
  data: AboutPageSettings["timeline"];
  locale: string;
}

/** Semi-circle opening downward — peak at top center (like reference). */
function pointOnArc(
  index: number,
  total: number,
  width: number,
  height: number
) {
  const t = total <= 1 ? 0.5 : index / (total - 1);
  const start = Math.PI * 0.98;
  const end = Math.PI * 0.02;
  const angle = start + (end - start) * t;
  const cx = width / 2;
  const cy = height * 0.95;
  const rx = width * 0.48;
  const ry = height * 0.88;
  return {
    x: cx + Math.cos(angle) * rx,
    y: cy - Math.sin(angle) * ry,
  };
}

export function AboutTimeline({ data, locale }: AboutTimelineProps) {
  const events = data.events;
  const [active, setActive] = useState(() =>
    Math.min(2, Math.max(events.length - 1, 0))
  );
  const reduceMotion = useReducedMotion();

  const go = useCallback(
    (next: number) => {
      if (events.length === 0) return;
      setActive(((next % events.length) + events.length) % events.length);
    },
    [events.length]
  );

  useEffect(() => {
    if (active >= events.length) setActive(0);
  }, [active, events.length]);

  if (events.length === 0) return null;

  const current = events[active];
  const prevLabel = pickLocalized(data.prevLabel, locale);
  const nextLabel = pickLocalized(data.nextLabel, locale);

  return (
    <section
      className="bg-white py-[clamp(5.5rem,14vw,10.5rem)]"
      aria-labelledby="about-timeline-heading"
    >
      <Container>
        <h2 id="about-timeline-heading" className="sr-only">
          Timeline
        </h2>

        <div className="hidden md:block">
          <CurvedTimeline
            events={events}
            active={active}
            onSelect={setActive}
            reduceMotion={!!reduceMotion}
          />
        </div>

        <div className="md:hidden">
          <MobileTimeline
            events={events}
            active={active}
            onSelect={setActive}
          />
        </div>

        <div className="mx-auto mt-6 max-w-lg text-center md:-mt-2 md:max-w-xl">
          <AnimatePresence mode="wait">
            <motion.p
              key={current.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="font-body text-[0.9375rem] leading-[1.7] text-oboya-blue-dark/55 md:text-base"
            >
              <span className="mb-3 block font-display text-xl font-semibold text-oboya-blue-dark md:hidden">
                {current.year}
              </span>
              {pickLocalized(current.description, locale)}
            </motion.p>
          </AnimatePresence>

          <div className="mt-12 flex items-center justify-center gap-0">
            <button
              type="button"
              onClick={() => go(active - 1)}
              className="group flex items-center gap-2.5 px-4 font-body text-[0.6875rem] font-medium tracking-[0.16em] text-oboya-blue-dark uppercase transition-colors hover:text-oboya-green md:px-6"
              aria-label={prevLabel}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-oboya-blue-dark/25 transition-colors group-hover:border-oboya-green">
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              </span>
              {prevLabel}
            </button>

            <span
              className="h-4 w-px shrink-0 bg-oboya-blue-dark/20"
              aria-hidden
            />

            <button
              type="button"
              onClick={() => go(active + 1)}
              className="group flex items-center gap-2.5 px-4 font-body text-[0.6875rem] font-medium tracking-[0.16em] text-oboya-blue-dark uppercase transition-colors hover:text-oboya-green md:px-6"
              aria-label={nextLabel}
            >
              {nextLabel}
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-oboya-blue-dark/25 transition-colors group-hover:border-oboya-green">
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}

function CurvedTimeline({
  events,
  active,
  onSelect,
  reduceMotion,
}: {
  events: AboutPageSettings["timeline"]["events"];
  active: number;
  onSelect: (index: number) => void;
  reduceMotion: boolean;
}) {
  const width = 1100;
  const height = 300;
  const n = events.length;

  /** Keep chronological order; active year labeled at its own position. */
  const arcPath = useMemo(() => {
    const points = Array.from({ length: 64 }, (_, i) =>
      pointOnArc(i, 64, width, height)
    );
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
  }, []);

  /** Show year labels for active + nearest neighbors (matches reference 3 labels). */
  const labeled = useMemo(() => {
    const set = new Set<number>([active]);
    if (active - 1 >= 0) set.add(active - 1);
    if (active + 1 < n) set.add(active + 1);
    // If at edge, prefer 3 visible labels when possible
    if (set.size < 3 && active - 2 >= 0) set.add(active - 2);
    if (set.size < 3 && active + 2 < n) set.add(active + 2);
    return set;
  }, [active, n]);

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
        role="list"
        aria-label="Company timeline"
      >
        <path
          d={arcPath}
          fill="none"
          stroke="#01203f"
          strokeOpacity="0.14"
          strokeWidth="1.25"
          strokeDasharray="3 7"
          strokeLinecap="round"
        />

        {events.map((event, index) => {
          const pos = pointOnArc(index, n, width, height);
          const isActive = index === active;
          const showLabel = labeled.has(index);

          return (
            <g key={event.id} role="listitem">
              {showLabel && (
                <motion.text
                  x={pos.x}
                  y={pos.y - (isActive ? 26 : 20)}
                  textAnchor="middle"
                  fill={isActive ? "#01203f" : "rgba(1,32,63,0.4)"}
                  style={{
                    fontSize: isActive ? 26 : 15,
                    fontWeight: isActive ? 600 : 500,
                  }}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  {event.year}
                </motion.text>
              )}
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={isActive ? 7 : 4.5}
                fill={isActive ? "#4daf4e" : "rgba(77, 175, 78, 0.55)"}
                className="cursor-pointer"
                onClick={() => onSelect(index)}
                whileHover={reduceMotion ? undefined : { scale: 1.2 }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={20}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onSelect(index)}
              >
                <title>{event.year}</title>
              </circle>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MobileTimeline({
  events,
  active,
  onSelect,
}: {
  events: AboutPageSettings["timeline"]["events"];
  active: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="-mx-[var(--container-padding)] overflow-x-auto px-[var(--container-padding)] pb-4">
      <ul className="flex min-w-max items-end gap-0" role="list">
        {events.map((event, index) => {
          const isActive = index === active;
          return (
            <li key={event.id} className="flex items-center">
              {index > 0 && (
                <span
                  className="mb-3 mx-0.5 h-px w-5 border-t border-dashed border-oboya-blue-dark/25 sm:w-8"
                  aria-hidden
                />
              )}
              <button
                type="button"
                onClick={() => onSelect(index)}
                className={cn(
                  "flex flex-col items-center gap-2 px-1.5 py-2",
                  isActive ? "text-oboya-blue-dark" : "text-oboya-blue-dark/35"
                )}
                aria-current={isActive ? "true" : undefined}
              >
                <span
                  className={cn(
                    "font-display text-sm font-semibold tabular-nums",
                    isActive ? "text-base" : "text-xs"
                  )}
                >
                  {event.year}
                </span>
                <span
                  className={cn(
                    "rounded-full",
                    isActive
                      ? "h-2.5 w-2.5 bg-oboya-green"
                      : "h-2 w-2 bg-oboya-green/50"
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
