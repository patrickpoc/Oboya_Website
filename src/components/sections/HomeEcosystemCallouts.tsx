"use client";

import { Fragment, type CSSProperties, type PointerEvent } from "react";
import { motion } from "framer-motion";
import type { Hotspot } from "@/components/sections/ecosystem-scenes/hotspots";
import { cn } from "@/lib/utils";

/**
 * Always-visible callouts over the scene: a dot on the object, a thin elbow leader and a pill with
 * the proof point text, in planned positions per breakpoint (`d` ≥ sm, `m` below). Hover, focus or
 * tap puts one callout in emphasis and fades the others out; leaving brings them all back.
 * The layer keeps the SVG viewBox aspect so percentages stay true when the panel is cropped.
 */
export function HomeEcosystemCallouts({
  id,
  spots,
  texts,
  active,
  isStatic,
  onActive,
}: {
  id: string;
  spots: Hotspot[];
  texts: string[];
  active: number | null;
  isStatic: boolean;
  onActive: (k: number | null) => void;
}) {
  const reveal = (k: number) => (isStatic ? { duration: 0 } : { duration: 0.4, delay: 1.8 + k * 0.25 });
  const hoverIn = (k: number) => (e: PointerEvent) => e.pointerType === "mouse" && onActive(k);
  const hoverOut = (e: PointerEvent) => e.pointerType === "mouse" && onActive(null);
  const tap = (k: number, lit: boolean) => (e: PointerEvent) => {
    if (e.pointerType === "mouse") return;
    onActive(lit ? null : k);
  };
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-[8/5] h-full -translate-x-1/2 -translate-y-1/2">
      {/* Leader lines: vertical from the dot, then horizontal to the pill. One set per breakpoint. */}
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {spots.map((h, k) => {
          const lit = active === k;
          const dim = active != null && !lit;
          return (["m", "d"] as const).map((bp) => {
            const a = h[bp];
            return (
              <motion.polyline
                key={`${id}-l${k}${bp}`}
                points={`${h.left},${h.top} ${h.left},${a.ly} ${a.lx},${a.ly}`}
                fill="none"
                vectorEffect="non-scaling-stroke"
                strokeWidth={lit ? 1.6 : 1}
                className={cn(
                  "transition-[stroke,stroke-width] duration-200",
                  bp === "m" ? "sm:hidden" : "max-sm:hidden",
                  lit ? "stroke-oboya-green-light" : "stroke-white/55",
                )}
                initial={isStatic ? false : { opacity: 0 }}
                animate={{ opacity: dim ? 0 : 1 }}
                transition={dim || active != null || isStatic ? { duration: 0.2 } : reveal(k)}
              />
            );
          });
        })}
      </svg>

      {spots.map((h, k) => {
        const lit = active === k;
        const dim = active != null && !lit;
        const vars = {
          "--eco-dlx": `${h.d.lx}%`,
          "--eco-dly": `${h.d.ly}%`,
          "--eco-mlx": `${h.m.lx}%`,
          "--eco-mly": `${h.m.ly}%`,
        } as CSSProperties;
        const fadeT = dim || active != null || isStatic ? { duration: 0.2 } : reveal(k);
        return (
          <Fragment key={`${id}-${k}`}>
            {/* Dot on the object */}
            <motion.span
              className={cn("absolute -translate-x-1/2 -translate-y-1/2 cursor-default p-2", dim ? "pointer-events-none" : "pointer-events-auto")}
              style={{ left: `${h.left}%`, top: `${h.top}%` }}
              initial={isStatic ? false : { opacity: 0 }}
              animate={{ opacity: dim ? 0 : 1 }}
              transition={fadeT}
              onPointerEnter={hoverIn(k)}
              onPointerLeave={hoverOut}
              onPointerDown={tap(k, lit)}
              data-eco-callout
            >
              <span
                className={cn(
                  "block size-2.5 rounded-full border transition-[background-color,box-shadow,border-color] duration-200",
                  lit ? "border-oboya-green-light bg-oboya-green-light ring-4 ring-oboya-green-light/35" : "border-oboya-blue-light bg-white ring-4 ring-white/15",
                )}
              />
            </motion.span>
            {/* Pill: the proof point text (already in the text column, hence aria-hidden) */}
            <motion.span
              aria-hidden
              data-eco-callout
              className={cn(
                "absolute -translate-y-1/2 cursor-default whitespace-nowrap rounded-sm border font-body leading-snug transition-[color,border-color,background-color] duration-200",
                "max-sm:left-(--eco-mlx) max-sm:top-(--eco-mly) max-sm:px-1.5 max-sm:py-px max-sm:text-[10px]",
                "sm:left-(--eco-dlx) sm:top-(--eco-dly) sm:px-2 sm:py-0.5 sm:text-xs",
                h.m.side === "l" && "max-sm:-translate-x-full",
                h.d.side === "l" && "sm:-translate-x-full",
                lit ? "border-oboya-green-light/70 bg-oboya-blue-dark text-white" : "border-white/20 bg-oboya-blue-dark/80 text-white/90",
                dim ? "pointer-events-none" : "pointer-events-auto",
              )}
              style={vars}
              initial={isStatic ? false : { opacity: 0 }}
              animate={{ opacity: dim ? 0 : 1 }}
              transition={fadeT}
              onPointerEnter={hoverIn(k)}
              onPointerLeave={hoverOut}
              onPointerDown={tap(k, lit)}
            >
              {texts[k]}
            </motion.span>
          </Fragment>
        );
      })}
    </div>
  );
}
