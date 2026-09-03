"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import { getItemAngle } from "@/hooks/useTimelineRotation";

interface AboutTimelineProps {
  data: AboutPageSettings["timeline"];
  locale: string;
  /** Transparent over hero scroll-backdrop (light type). */
  overBackdrop?: boolean;
}

type TimelineEvent = AboutPageSettings["timeline"]["events"][number];

/** Neighbors sit at half the true rim spacing (closer to the apex). */
const NEIGHBOR_SPREAD = 0.5;
const RIM_SPIN_DURATION = 0.9;
/** Shared so Previous exit and Next recenter stay locked together. */
const NAV_TRANSITION = {
  duration: 0.55,
  ease: [0.33, 1, 0.28, 1] as const,
};

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

function wrapIndex(index: number, count: number) {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

function shortestAngleDelta(a: number, b: number) {
  // Normalize for any accumulated focus angle (incl. wrap past ±360)
  const d = ((((a - b) % 360) + 360) % 360);
  return d > 180 ? d - 360 : d;
}

/**
 * /about timeline: fixed green bowl + rotating year rim.
 * Always previous · active · next (wrap). One-step rotation — never long-way across the screen.
 *
 * Start state (index 0): only Next is shown (centered); the wrap-around prev year on
 * the rim stays hidden until the user completes a full loop. After that, both nav
 * buttons remain visible even on the first year.
 */
export function AboutTimeline({
  data,
  locale,
  overBackdrop = false,
}: AboutTimelineProps) {
  const events = data.events;
  const onDark = overBackdrop;
  const [active, setActive] = useState(0);
  const [hasCompletedLoop, setHasCompletedLoop] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const reduceMotion = useReducedMotion();

  const go = useCallback(
    (next: number) => {
      if (events.length === 0 || isAnimating) return;
      const target = wrapIndex(next, events.length);
      if (target === active) return;
      // Full wrap last→first or first→last unlocks start-state restrictions.
      if (
        (active === events.length - 1 && target === 0) ||
        (active === 0 && target === events.length - 1)
      ) {
        setHasCompletedLoop(true);
      }
      setActive(target);
    },
    [active, events.length, isAnimating]
  );

  const select = useCallback(
    (index: number) => {
      if (events.length === 0 || isAnimating) return;
      const target = wrapIndex(index, events.length);
      if (target === active) return;
      if (
        (active === events.length - 1 && target === 0) ||
        (active === 0 && target === events.length - 1)
      ) {
        setHasCompletedLoop(true);
      }
      setActive(target);
    },
    [active, events.length, isAnimating]
  );

  useEffect(() => {
    if (active >= events.length) setActive(0);
  }, [active, events.length]);

  if (events.length === 0) return null;

  const prevLabel = pickLocalized(data.prevLabel, locale);
  const nextLabel = pickLocalized(data.nextLabel, locale);
  const showPrevNav = hasCompletedLoop || active !== 0;

  const nav = (
    <div className="relative z-20 mx-auto h-9 w-full max-w-xl">
      <AnimatePresence initial={false}>
        {showPrevNav ? (
          <motion.div
            key="prev-nav"
            className="absolute top-1/2 right-1/2 flex items-center"
            initial={
              reduceMotion ? false : { opacity: 0, x: "-2.75rem", y: "-50%" }
            }
            animate={{ opacity: 1, x: "-0.75rem", y: "-50%" }}
            exit={
              reduceMotion
                ? undefined
                : { opacity: 0, x: "-4.25rem", y: "-50%" }
            }
            transition={NAV_TRANSITION}
          >
            <button
              type="button"
              onClick={() => go(active - 1)}
              disabled={isAnimating}
              className={`group relative z-20 flex items-center gap-2 px-1 font-body text-sm font-semibold tracking-[0.12em] uppercase transition-colors sm:gap-3 sm:px-2 sm:text-[1.125rem] sm:tracking-[0.14em] md:px-3 ${
                onDark
                  ? "text-white hover:text-oboya-green-light"
                  : "text-oboya-blue-dark hover:text-oboya-green"
              }`}
              aria-label={prevLabel}
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                  onDark
                    ? "bg-oboya-green text-white group-hover:bg-oboya-green-light"
                    : "border border-oboya-green/70 text-oboya-green group-hover:border-oboya-green group-hover:bg-oboya-green/10"
                }`}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </span>
              <span className="max-[359px]:sr-only whitespace-nowrap">
                {prevLabel}
              </span>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        className="absolute top-1/2 left-1/2 flex items-center"
        initial={false}
        animate={
          showPrevNav
            ? { x: "0.75rem", y: "-50%" }
            : { x: "-50%", y: "-50%" }
        }
        transition={reduceMotion ? { duration: 0 } : NAV_TRANSITION}
      >
        <button
          type="button"
          onClick={() => go(active + 1)}
          disabled={isAnimating}
          className={`group relative z-20 flex shrink-0 items-center gap-2 px-1 font-body text-sm font-semibold tracking-[0.12em] uppercase transition-colors sm:gap-3 sm:px-2 sm:text-[1.125rem] sm:tracking-[0.14em] md:px-3 ${
            onDark
              ? "text-white hover:text-oboya-green-light"
              : "text-oboya-blue-dark hover:text-oboya-green"
          }`}
          aria-label={nextLabel}
        >
          <span className="max-[359px]:sr-only whitespace-nowrap">
            {nextLabel}
          </span>
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors ${
              onDark
                ? "bg-oboya-green text-white group-hover:bg-oboya-green-light"
                : "border border-oboya-green/70 text-oboya-green group-hover:border-oboya-green group-hover:bg-oboya-green/10"
            }`}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        </button>
      </motion.div>
    </div>
  );

  return (
    <section
      className={`relative overflow-x-clip py-[clamp(2.52rem,6.72vw,4.2rem)] ${
        onDark ? "bg-transparent" : "bg-white"
      }`}
      aria-labelledby="about-timeline-heading"
    >
      <h2 id="about-timeline-heading" className="sr-only">
        Timeline
      </h2>

      <RotatingRimTimeline
        events={events}
        active={active}
        onSelect={select}
        locale={locale}
        reduceMotion={!!reduceMotion}
        nav={nav}
        showWrapPrevYear={hasCompletedLoop}
        isAnimating={isAnimating}
        onAnimatingChange={setIsAnimating}
        onDark={onDark}
      />
    </section>
  );
}

function RotatingRimTimeline({
  events,
  active,
  onSelect,
  locale,
  reduceMotion,
  nav,
  showWrapPrevYear,
  isAnimating,
  onAnimatingChange,
  onDark,
}: {
  events: TimelineEvent[];
  active: number;
  onSelect: (index: number) => void;
  locale: string;
  reduceMotion: boolean;
  nav: ReactNode;
  showWrapPrevYear: boolean;
  isAnimating: boolean;
  onAnimatingChange: (animating: boolean) => void;
  onDark: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const focusProxy = useRef({ angle: 0 });
  const prevActive = useRef(active);
  const touchStartX = useRef<number | null>(null);
  const [width, setWidth] = useState(1200);
  const [focusAngle, setFocusAngle] = useState(0);
  const count = events.length;

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
    const stepDeg = count > 0 ? 360 / count : 60;
    // Neighbors rendered at half spacing → α only needs to cover that fan
    const visualStep = stepDeg * NEIGHBOR_SPREAD;
    const needAlpha = Math.min(Math.max(visualStep * 1.2, 34), 48);
    const rise = (w / 2) * Math.tan(((needAlpha / 2) * Math.PI) / 180);
    const radius = (rise * rise + (w / 2) * (w / 2)) / (2 * rise);
    const alphaRad = Math.acos(
      Math.min(1, Math.max(0, (radius - rise) / radius))
    );
    const alpha = (alphaRad * 180) / Math.PI;
    const apexPad = 13;
    const cx = w / 2;
    const cy = apexPad + radius;
    const height = apexPad + rise + 5;
    const visualStepRad = (visualStep * Math.PI) / 180;
    const neighborY = apexPad + radius * (1 - Math.cos(visualStepRad));
    const contentReserve = w < 640 ? 218 : 269;
    const frameHeight = Math.max(height, neighborY + 41) + contentReserve;

    return {
      width: w,
      height,
      radius,
      apexPad,
      cx,
      cy,
      alpha,
      rise,
      frameHeight,
      stepDeg,
    };
  }, [width, count]);

  const { height, radius, cx, cy, alpha, apexPad, frameHeight, stepDeg } =
    metrics;
  const diameter = radius * 2;
  const arcPath = describeArc(cx, cy, radius, -alpha, alpha);

  // Fan focus: one-step path (wrap last↔first). Snap to canonical angle after each step
  // so focus never drifts and the start state stays identical after a full cycle.
  useLayoutEffect(() => {
    const step = count > 0 ? 360 / count : 0;
    const canonical = getItemAngle(active, count);
    const prev = prevActive.current;
    const forward = (active - prev + count) % count;
    const backward = (prev - active + count) % count;
    const signedSteps = forward <= backward ? forward : -backward;
    const delta = signedSteps * step;
    const from = focusProxy.current.angle;
    const to = from + delta;
    prevActive.current = active;

    gsap.killTweensOf(focusProxy.current);

    const snapCanonical = () => {
      focusProxy.current.angle = canonical;
      setFocusAngle(canonical);
      onAnimatingChange(false);
    };

    if (reduceMotion || delta === 0) {
      snapCanonical();
      return;
    }

    onAnimatingChange(true);
    gsap.fromTo(
      focusProxy.current,
      { angle: from },
      {
        angle: to,
        duration: RIM_SPIN_DURATION,
        ease: "power3.out",
        overwrite: true,
        onUpdate: () => setFocusAngle(focusProxy.current.angle),
        onComplete: snapCanonical,
        onInterrupt: () => onAnimatingChange(false),
      }
    );

    return () => {
      gsap.killTweensOf(focusProxy.current);
      onAnimatingChange(false);
    };
  }, [active, count, reduceMotion, onAnimatingChange]);

  const current = events[active];

  const handleTouchStart = (event: React.TouchEvent) => {
    if (isAnimating) return;
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (isAnimating) return;
    if (touchStartX.current == null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    const goingPrev = delta > 0;
    // Mirror start-state nav: no wrap-back until the loop is unlocked.
    if (goingPrev && active === 0 && !showWrapPrevYear) return;
    onSelect(wrapIndex(active + (delta < 0 ? 1 : -1), count));
  };

  return (
    <div
      ref={frameRef}
      className="relative w-full touch-pan-y overflow-visible"
      style={{ height: frameHeight }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Static green bowl — endpoints on screen edges */}
      <svg
        className="pointer-events-none absolute inset-x-0 top-0 h-auto w-full overflow-visible"
        viewBox={`0 0 ${metrics.width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <path
          d={arcPath}
          fill="none"
          stroke={onDark ? "#ffffff" : "transparent"}
          strokeWidth="2.2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
        <path
          d={arcPath}
          fill="none"
          stroke="#4daf4e"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
      </svg>

      {/* Years fan: compressed toward apex (neighbors at half distance) */}
      <div
        className="pointer-events-none absolute left-1/2"
        style={{
          width: diameter,
          height: diameter,
          top: cy,
          transform: "translate3d(-50%, -50%, 0)",
        }}
      >
        <ul
          role="list"
          className="pointer-events-none absolute inset-0 m-0 list-none p-0"
        >
          {events.map((event, index) => (
            <RimYear
              key={event.id}
              event={event}
              index={index}
              count={count}
              activeIndex={active}
              focusAngle={focusAngle}
              stepDeg={stepDeg}
              radius={radius}
              onSelect={onSelect}
              showWrapPrevYear={showWrapPrevYear}
              disabled={isAnimating}
              onDark={onDark}
            />
          ))}
        </ul>
      </div>

      {/* Apex column: drip stack (nav pinned to first-year layout position) */}
      <div
        className="pointer-events-none absolute left-1/2 z-10 flex w-[min(92vw,30.24rem)] -translate-x-1/2 flex-col items-center px-4 sm:px-6"
        style={{ top: apexPad }}
      >
        {/* Invisible spacer matching rim tip footprint so stem stays under apex */}
        <span
          className="block size-4 shrink-0 -translate-y-1/2 opacity-0"
          aria-hidden
        />

        {/* Fixed-height slot = first-year copy footprint so nav never shifts */}
        <div className="relative w-full min-h-[11.34rem] sm:min-h-[14.1rem] md:min-h-[14.7rem]">
          <AnimatePresence mode="wait">
            {current ? (
              <motion.div
                key={current.id}
                className="absolute inset-x-0 top-0 flex w-full flex-col items-center"
                initial="hidden"
                animate="show"
                exit="exit"
                variants={
                  reduceMotion
                    ? undefined
                    : {
                        hidden: {},
                        show: {
                          transition: {
                            staggerChildren: 0.12,
                            delayChildren: 0.2,
                          },
                        },
                        exit: {
                          transition: {
                            staggerChildren: 0.05,
                            staggerDirection: -1,
                          },
                        },
                      }
                }
              >
                <motion.span
                  aria-hidden
                  className={`mt-3.5 block h-12 w-px shrink-0 origin-top bg-oboya-green sm:mt-4 md:mt-5 md:h-[4.8rem] ${
                    onDark
                      ? "shadow-[-0.1px_0_0_#fff,0.1px_0_0_#fff]"
                      : ""
                  }`}
                  variants={
                    reduceMotion
                      ? undefined
                      : {
                          hidden: { opacity: 0, scaleY: 0, y: -10 },
                          show: {
                            opacity: 1,
                            scaleY: 1,
                            y: 0,
                            transition: {
                              duration: 0.32,
                              ease: [0.22, 1, 0.36, 1],
                            },
                          },
                          exit: {
                            opacity: 0,
                            scaleY: 0.25,
                            y: -8,
                            transition: { duration: 0.16, ease: "easeIn" },
                          },
                        }
                  }
                />

                <motion.p
                  className={`mt-2 font-display text-[clamp(1.26rem,4.2vw,1.974rem)] leading-none font-semibold tabular-nums tracking-tight sm:mt-2.5 ${
                    onDark ? "text-white" : "text-oboya-blue-dark"
                  }`}
                  variants={
                    reduceMotion
                      ? undefined
                      : {
                          hidden: { opacity: 0, y: -14 },
                          show: {
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.3,
                              ease: [0.22, 1, 0.36, 1],
                            },
                          },
                          exit: {
                            opacity: 0,
                            y: -6,
                            transition: { duration: 0.12 },
                          },
                        }
                  }
                >
                  {current.year}
                </motion.p>

                <motion.p
                  className={`mt-2.5 max-w-lg px-1 text-center font-body text-[0.9375rem] font-medium leading-relaxed sm:mt-3.5 sm:text-lg md:mt-4 md:text-xl ${
                    onDark ? "text-white" : "text-oboya-blue-dark/55"
                  }`}
                  variants={
                    reduceMotion
                      ? undefined
                      : {
                          hidden: { opacity: 0, y: -16 },
                          show: {
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.32,
                              ease: [0.22, 1, 0.36, 1],
                            },
                          },
                          exit: {
                            opacity: 0,
                            y: -4,
                            transition: { duration: 0.1 },
                          },
                        }
                  }
                >
                  {pickLocalized(current.description, locale)}
                </motion.p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="pointer-events-auto mt-[3.6rem] shrink-0 sm:mt-[4.8rem] md:mt-24 lg:mt-[7.2rem]">
          {nav}
        </div>
      </div>
    </div>
  );
}

function RimYear({
  event,
  index,
  count,
  activeIndex,
  focusAngle,
  stepDeg,
  radius,
  onSelect,
  showWrapPrevYear,
  disabled,
  onDark,
}: {
  event: TimelineEvent;
  index: number;
  count: number;
  activeIndex: number;
  focusAngle: number;
  stepDeg: number;
  radius: number;
  onSelect: (index: number) => void;
  showWrapPrevYear: boolean;
  disabled: boolean;
  onDark: boolean;
}) {
  const itemAngle = getItemAngle(index, count);
  const delta = shortestAngleDelta(itemAngle, focusAngle);
  const displayAngle = delta * NEIGHBOR_SPREAD;
  const absDelta = Math.abs(delta);
  // Soft “active” weight while the tip travels along the arc
  const apexWeight = Math.max(0, 1 - absDelta / Math.max(stepDeg, 1));
  const isNearApex = apexWeight > 0.55;
  // Discrete slots guarantee start/end of cycle always show 3 tips
  const isActiveSlot = index === activeIndex;
  const isPrevSlot = index === wrapIndex(activeIndex - 1, count);
  const isNextSlot = index === wrapIndex(activeIndex + 1, count);
  // Before a full loop, hide the wrap-around year to the left of the first milestone.
  const hideWrapPrev =
    !showWrapPrevYear && activeIndex === 0 && isPrevSlot;
  const visible =
    (isActiveSlot || isPrevSlot || isNextSlot) && !hideWrapPrev;

  return (
    <li
      className="absolute top-1/2 left-1/2 h-0 w-0"
      style={{
        transform: `rotate(${displayAngle}deg) translate3d(0, -${radius}px, 0)`,
        opacity: visible ? 1 : 0,
        pointerEvents: visible && !disabled ? "auto" : "none",
        transition: "opacity 0.35s ease",
        zIndex: isNearApex || isActiveSlot ? 2 : 1,
      }}
      role="listitem"
    >
      <button
        type="button"
        onClick={() => onSelect(index)}
        disabled={disabled}
        aria-label={event.year}
        aria-current={isActiveSlot ? "true" : undefined}
        tabIndex={visible && !disabled ? 0 : -1}
        className="pointer-events-auto absolute left-0 top-0 flex -translate-x-1/2 flex-col items-center outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/40 disabled:pointer-events-none"
      >
        <span
          className="absolute top-0 left-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full bg-oboya-green transition-[width,height,box-shadow] duration-300 ease-out"
          style={{
            width: 10 + apexWeight * 4,
            height: 10 + apexWeight * 4,
            boxShadow:
              apexWeight > 0.5
                ? `0 0 0 ${3 + apexWeight * 2}px rgba(77,175,78,${0.12 + apexWeight * 0.1})`
                : "none",
          }}
          aria-hidden
        />
        {/* Side years only — hide label as the tip nears the apex */}
        <span
          className={`mt-4 whitespace-nowrap font-display text-sm font-semibold tabular-nums tracking-wide transition-opacity duration-300 sm:mt-5 sm:text-base md:text-lg ${
            onDark ? "text-white" : "text-oboya-blue-dark/50"
          }`}
          style={{ opacity: visible && !isNearApex ? 1 : 0 }}
        >
          {event.year}
        </span>
      </button>
    </li>
  );
}
