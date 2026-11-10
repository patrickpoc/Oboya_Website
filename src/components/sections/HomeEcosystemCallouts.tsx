"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
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
  "absolute -translate-y-1/2 cursor-default rounded-sm border text-center font-body leading-[1.3] tracking-[0.01em] text-balance transition-[color,border-color,background-color] duration-200 " +
  "max-sm:max-w-[7.5rem] max-sm:px-1.5 max-sm:py-[3px] max-sm:text-[10px] sm:max-w-[13.5rem] sm:px-2.5 sm:py-1 sm:text-xs";
/**
 * Pill position from an anchor: the leader's horizontal run ends at `lx`; a right-hung pill starts
 * there (`left`), a left-hung one ends there (`right`). Using the matching inset keeps the browser's
 * shrink-to-fit width measured on the free side, so pills only wrap when they really are too long.
 */
const pillVars = (prefix: "d" | "m", a: { lx: number; ly: number; side: "l" | "r" }) => ({
  [`--eco-${prefix}lx`]: a.side === "r" ? `${a.lx}%` : "auto",
  [`--eco-${prefix}rx`]: a.side === "l" ? `${100 - a.lx}%` : "auto",
  [`--eco-${prefix}ly`]: `${a.ly}%`,
});

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
  onHover,
}: {
  id: string;
  spots: Hotspot[];
  texts: string[];
  active: number | null;
  isStatic: boolean;
  onActive: (k: number | null) => void;
  /** Mouse hover over a pill or dot (touch never fires it). */
  onHover?: (on: boolean) => void;
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

  const hoverIn = (k: number) => (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    onActive(k);
    onHover?.(true);
  };
  const hoverOut = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    onActive(null);
    onHover?.(false);
  };
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
        const vars = { ...pillVars("d", h.d), ...pillVars("m", h.m) } as CSSProperties;
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
                  lit ? "border-oboya-green-light bg-oboya-green-light ring-[3px] ring-oboya-green-light/35" : "border-oboya-blue-light bg-white ring-[3px] ring-white/12",
                )}
              />
            </motion.span>
            {/* Pill: the proof point text (already in the text column, hence aria-hidden) */}
            <motion.span
              aria-hidden
              data-eco-callout
              className={cn(
                PILL,
                "max-sm:left-(--eco-mlx) max-sm:right-(--eco-mrx) max-sm:top-(--eco-mly) sm:left-(--eco-dlx) sm:right-(--eco-drx) sm:top-(--eco-dly)",
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

const SIGN_START = 1.1; // label start, in ring radii from the node centre (x)
const SIGN_LIFT = 1.05; // and above it (y)
const COS30 = 0.8660254;
const SIN30 = 0.5;

/**
 * Closing scene: the six stage names as signage lying along the isometric y axis — each label
 * starts at the upper-right edge of its node ring and climbs at 30° (the iso angle), so the six
 * read as a diagonal ladder without leaders. Revealed as each node lights up, then kept. Text is
 * the localized stage label; the rail already lists the names, so the layer is aria-hidden.
 *
 * Centring: label lengths depend on locale and CMS text, so after layout the component measures
 * each label (unrotated size + the −30° geometry), unions that with the static node `bounds`, and
 * sets `--eco-ov-dx/dy` (viewBox units) on the panel so the composition's centre meets the centre
 * of the *visible* panel (the 4:3 mobile crop included). The overview SVG group reads the same vars.
 */
export function HomeEcosystemOverviewLabels({
  nodes,
  bounds,
  labels,
  isStatic,
}: {
  nodes: { left: number; top: number; r: number; delay: number }[];
  bounds: { left: number; right: number; top: number; bottom: number };
  labels: string[];
  isStatic: boolean;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const layer = layerRef.current;
    const panel = layer?.parentElement;
    if (!layer || !panel) return;
    const centre = () => {
      const lr = layer.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      if (!lr.height) return;
      const upp = 500 / lr.height; // viewBox units per CSS px
      let [l, t, r, b] = [bounds.left, bounds.top, bounds.right, bounds.bottom];
      layer.querySelectorAll<HTMLElement>("[data-eco-sign]").forEach((el, k) => {
        const n = nodes[k];
        if (!n) return;
        const ax = ((n.left + n.r * SIGN_START) / 100) * 800;
        const ay = ((n.top - n.r * SIGN_LIFT) / 100) * 500;
        const w = el.offsetWidth * upp;
        const h = el.offsetHeight * upp;
        r = Math.max(r, ax + w * COS30 + (h / 2) * SIN30);
        t = Math.min(t, ay - w * SIN30 - (h / 2) * COS30);
        l = Math.min(l, ax - (h / 2) * SIN30);
        b = Math.max(b, ay + (h / 2) * COS30);
      });
      const visL = (pr.left - lr.left) * upp;
      const visR = (pr.right - lr.left) * upp;
      const dx = Math.round((visL + visR) / 2 - (l + r) / 2);
      const dy = Math.round(250 - (t + b) / 2);
      panel.style.setProperty("--eco-ov-dx", String(dx));
      panel.style.setProperty("--eco-ov-dy", String(dy));
    };
    centre();
    const ro = new ResizeObserver(centre);
    ro.observe(panel);
    return () => {
      ro.disconnect();
      panel.style.removeProperty("--eco-ov-dx");
      panel.style.removeProperty("--eco-ov-dy");
    };
  }, [nodes, bounds, labels]);

  const reveal = (k: number) => (isStatic ? { duration: 0 } : { duration: 0.45, delay: nodes[k].delay + 0.15 });
  return (
    <div ref={layerRef} className={LAYER} aria-hidden>
      {nodes.map((n, k) => (
        <motion.span
          key={`ov-${k}`}
          data-eco-sign
          className={cn(
            "absolute origin-left -translate-y-1/2 -rotate-30 whitespace-nowrap font-body font-light leading-none text-white max-sm:tracking-wide sm:tracking-wider",
            // Mobile scales with the viewport so the longest label still clears the 4:3 crop at 320 px.
            "max-sm:text-[length:clamp(8px,2.5vw,11px)] sm:text-base lg:text-[17px]",
            // A thin green rule under the text, running along the slope.
            "after:absolute after:left-0 after:right-0 after:-bottom-1.5 after:h-px after:bg-oboya-green-light/55",
          )}
          style={{
            left: `calc(${n.left + n.r * SIGN_START}% + var(--eco-ov-dx, 0) / 8 * 1%)`,
            top: `calc(${n.top - n.r * SIGN_LIFT}% + var(--eco-ov-dy, 0) / 5 * 1%)`,
          }}
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
