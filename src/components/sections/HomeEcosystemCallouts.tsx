"use client";

import { Fragment, useEffect, useState, type CSSProperties, type PointerEvent } from "react";
import { motion } from "framer-motion";
import type { Hotspot } from "@/components/sections/ecosystem-scenes/hotspots";
import { cn } from "@/lib/utils";

/** Entrance: after the scene has drawn its main objects, one callout every 150 ms. */
const ENTER_DELAY = 0.6;
const ENTER_STEP = 0.15;
const ENTER_DUR = 0.4;
const SWAP = { duration: 0.2 } as const;

/**
 * The HTML layer over the scene SVGs. It keeps the SVG viewBox aspect (8:5) so percentages stay
 * true when the panel is cropped to 4:3 on mobile, and sits above every scene (z-10 inside the
 * panel's isolated stacking context), including scenes fading out through AnimatePresence.
 */
const LAYER = "pointer-events-none absolute left-1/2 top-1/2 z-10 aspect-[8/5] h-full -translate-x-1/2 -translate-y-1/2";
/**
 * Pills size to their text, wrapping to at most two balanced lines inside a per-breakpoint
 * max-width (the anchors in hotspots.ts assume these widths).
 */
const PILL =
  "absolute -translate-y-1/2 cursor-default rounded-sm border text-center font-body leading-snug text-balance transition-[color,border-color,background-color] duration-200 " +
  "max-sm:max-w-[6.75rem] max-sm:px-1.5 max-sm:py-px max-sm:text-[10px] sm:max-w-[11rem] sm:px-2 sm:py-0.5 sm:text-xs";

/**
 * Always-visible callouts over the scene: a dot on the object, a thin elbow leader and a pill with
 * the proof point text, in planned positions per breakpoint (`d` ≥ sm, `m` below). Hover, focus or
 * tap puts one callout in emphasis and fades the others out; leaving brings them all back (200 ms).
 * Mount with a per-scene key so the entrance replays for each stage.
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
  // The staggered entrance runs once; every later opacity change (emphasis in/out) is a quick swap.
  const [revealed, setRevealed] = useState(isStatic);
  useEffect(() => {
    if (revealed) return;
    const ms = (ENTER_DELAY + (spots.length - 1) * ENTER_STEP + ENTER_DUR) * 1000;
    const timer = window.setTimeout(() => setRevealed(true), ms);
    return () => window.clearTimeout(timer);
  }, [revealed, spots.length]);
  const fade = (k: number) => (revealed ? SWAP : { duration: ENTER_DUR, delay: ENTER_DELAY + k * ENTER_STEP });

  const hoverIn = (k: number) => (e: PointerEvent) => e.pointerType === "mouse" && onActive(k);
  const hoverOut = (e: PointerEvent) => e.pointerType === "mouse" && onActive(null);
  const press = (k: number, lit: boolean) => (e: PointerEvent) => {
    // Keep focus where it is (a focused proof point would otherwise blur and reset the emphasis).
    e.preventDefault();
    if (e.pointerType === "mouse") return;
    onActive(lit ? null : k);
  };
  return (
    <div className={LAYER}>
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
                transition={fade(k)}
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
        return (
          <Fragment key={`${id}-${k}`}>
            {/* Dot on the object */}
            <motion.span
              className={cn("absolute -translate-x-1/2 -translate-y-1/2 cursor-default p-2", dim ? "pointer-events-none" : "pointer-events-auto")}
              style={{ left: `${h.left}%`, top: `${h.top}%` }}
              initial={isStatic ? false : { opacity: 0 }}
              animate={{ opacity: dim ? 0 : 1 }}
              transition={fade(k)}
              onPointerEnter={hoverIn(k)}
              onPointerLeave={hoverOut}
              onPointerDown={press(k, lit)}
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
                PILL,
                "max-sm:left-(--eco-mlx) max-sm:top-(--eco-mly) sm:left-(--eco-dlx) sm:top-(--eco-dly)",
                h.m.side === "l" && "max-sm:-translate-x-full",
                h.d.side === "l" && "sm:-translate-x-full",
                lit ? "border-oboya-green-light/70 bg-oboya-blue-dark text-white" : "border-white/20 bg-oboya-blue-dark/80 text-white/90",
                dim ? "pointer-events-none" : "pointer-events-auto",
              )}
              style={vars}
              initial={isStatic ? false : { opacity: 0 }}
              animate={{ opacity: dim ? 0 : 1 }}
              transition={fade(k)}
              onPointerEnter={hoverIn(k)}
              onPointerLeave={hoverOut}
              onPointerDown={press(k, lit)}
            >
              {texts[k]}
            </motion.span>
          </Fragment>
        );
      })}
    </div>
  );
}

/**
 * Closing scene: the six stage names as signage lying along the isometric y axis — each label
 * starts at the upper-right edge of its node ring and climbs at 30° (the iso angle), so the six
 * read as a diagonal ladder without leaders. Revealed as each node lights up, then kept. Text is
 * the localized stage label; the rail already lists the names, so the layer is aria-hidden.
 */
export function HomeEcosystemOverviewLabels({
  nodes,
  labels,
  isStatic,
}: {
  nodes: { left: number; top: number; r: number; delay: number }[];
  labels: string[];
  isStatic: boolean;
}) {
  const reveal = (k: number) => (isStatic ? { duration: 0 } : { duration: 0.45, delay: nodes[k].delay + 0.15 });
  return (
    <div className={LAYER} aria-hidden>
      {nodes.map((n, k) => (
        <motion.span
          key={`ov-${k}`}
          className={cn(
            "absolute origin-left -translate-y-1/2 -rotate-30 whitespace-nowrap font-body leading-none tracking-wide text-white/95",
            "max-sm:text-[10px] sm:text-sm",
            // A thin green tick under the text, running along the slope.
            "after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-px after:bg-oboya-green-light/55",
          )}
          style={{ left: `${n.left + n.r * 0.9}%`, top: `${n.top - n.r * 0.9}%` }}
          initial={isStatic ? false : { opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={reveal(k)}
        >
          {labels[k]}
        </motion.span>
      ))}
    </div>
  );
}
