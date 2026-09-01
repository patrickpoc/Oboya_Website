"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  CalendarDays,
  Factory,
  Globe2,
  Handshake,
  Package,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  SQUEEZE_BANNER_S,
  SQUEEZE_CARD_SURFACE_CLASS,
  SQUEEZE_MEDIA_LAYER_CLASS,
  squeezeCardTransition,
  squeezeCardZIndex,
  squeezeCollapsedPanelOpacity,
  squeezeExpandedPanelOpacity,
  squeezeLayerTransition,
  squeezeLayoutTransition,
  squeezePanelTransition,
} from "@/lib/squeeze-carousel-motion";
import type {
  AboutImpactStatIcon,
  AboutPageSettings,
} from "@/lib/cms/repositories/about-page-repository";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";

const BANNER_TRANSITION_S = SQUEEZE_BANNER_S;
const COLLAPSED_BASIS = "4.25rem";
const MOBILE_COLLAPSED_BASIS = "2.75rem";
const MOBILE_EXPANDED_BASIS = "16rem";
const ICON_BUBBLE_REM = 2; // size-8
/** Centers the icon bubble vertically within the collapsed mobile strip. */
const MOBILE_ICON_PAD_TOP = `calc((${MOBILE_COLLAPSED_BASIS} - ${ICON_BUBBLE_REM}rem) / 2)`;
const DESKTOP_ICON_PAD = "1.25rem";
const DESKTOP_ICON_PAD_X_EXPANDED = "1.5rem";
const DESKTOP_ICON_PAD_X_COLLAPSED = "0.375rem";
const MOBILE_ICON_PAD_X = "1rem";
const AUTOPLAY_MS = 4600;

/** Soft White / Light Yellow / Light Green — need dark type on solid fills. */
const LIGHT_ACCENTS = new Set(
  ["#f1f5f1", "#dbe64c", "#75c566"].map((c) => c.toLowerCase())
);

type ImpactStat = AboutPageSettings["impact"]["stats"][number];

const ICON_MAP: Record<AboutImpactStatIcon, LucideIcon> = {
  globe: Globe2,
  factory: Factory,
  building: Building2,
  users: Users,
  handshake: Handshake,
  package: Package,
  calendar: CalendarDays,
};

export interface NumbersSqueezeCarouselProps {
  stats: ImpactStat[];
  locale: string;
}

function isLightAccent(hex: string) {
  return LIGHT_ACCENTS.has(hex.trim().toLowerCase());
}

/** Desktop: icon top inset is constant; only axis orientation changes between states. */
function iconMotionDesktop(isActive: boolean) {
  return {
    justifyContent: isActive ? "flex-start" : "space-between",
    alignItems: isActive ? "flex-start" : "center",
    paddingTop: DESKTOP_ICON_PAD,
    paddingBottom: DESKTOP_ICON_PAD,
    paddingLeft: isActive ? DESKTOP_ICON_PAD_X_EXPANDED : DESKTOP_ICON_PAD_X_COLLAPSED,
    paddingRight: isActive ? DESKTOP_ICON_PAD_X_EXPANDED : DESKTOP_ICON_PAD_X_COLLAPSED,
  };
}

/** Mobile: same top/left inset open or closed; row alignment handles orientation. */
function iconMotionMobile() {
  return {
    paddingTop: MOBILE_ICON_PAD_TOP,
    paddingBottom: 0,
    paddingLeft: MOBILE_ICON_PAD_X,
    paddingRight: MOBILE_ICON_PAD_X,
  };
}

function MetricValue({
  stat,
  label,
  reduceMotion,
  animate = false,
  className,
}: {
  stat: ImpactStat;
  label: string;
  reduceMotion: boolean;
  animate?: boolean;
  className?: string;
}) {
  if (stat.pending) {
    return (
      <span className={className} aria-label={`${label}: data pending`}>
        XX
      </span>
    );
  }

  if (reduceMotion || !animate) {
    return (
      <span className={className}>
        {stat.value}
        {stat.suffix}
      </span>
    );
  }

  return (
    <span className={className}>
      <AnimatedCounter
        value={stat.value}
        suffix={stat.suffix}
        duration={1.4}
        active={animate}
      />
    </span>
  );
}

export function NumbersSqueezeCarousel({
  stats,
  locale,
}: NumbersSqueezeCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [counterReadyIndex, setCounterReadyIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  const count = stats.length;
  const activeStat = stats[activeIndex] ?? stats[0];

  const goTo = useCallback(
    (index: number) => {
      if (count === 0 || index === activeIndex) return;
      setActiveIndex(((index % count) + count) % count);
    },
    [activeIndex, count]
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  // Defer counter until the panel expand finishes — avoids layout + rAF contention.
  useEffect(() => {
    if (reduceMotion) {
      setCounterReadyIndex(activeIndex);
      return;
    }
    setCounterReadyIndex(-1);
    const id = window.setTimeout(
      () => setCounterReadyIndex(activeIndex),
      BANNER_TRANSITION_S * 1000
    );
    return () => window.clearTimeout(id);
  }, [activeIndex, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || paused || count < 2) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, paused, reduceMotion]);

  if (count === 0 || !activeStat) return null;

  const reduce = Boolean(reduceMotion);
  const cardTransition = squeezeCardTransition(reduce);
  const layerTransition = squeezeLayerTransition(reduce);
  const iconTransition = squeezeLayoutTransition(reduce);

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <p className="sr-only" aria-live="polite">
        {pickLocalized(activeStat.label, locale)}
      </p>

      <LayoutGroup id="numbers-squeeze-desktop">
      <div
        className={cn(
          "hidden w-full md:flex md:h-[min(24rem,52vh)] md:min-h-[19rem] md:gap-2.5 lg:gap-3",
          "focus-within:outline-none"
        )}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            goPrev();
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            goNext();
          }
        }}
      >
        {stats.map((stat, index) => {
          const isActive = index === activeIndex;
          const label = pickLocalized(stat.label, locale);
          const Icon = ICON_MAP[stat.icon] ?? Globe2;
          const accent = stat.accentColor || "#4DAF4E";
          const onLight = isLightAccent(accent);
          const collapsedInk = onLight
            ? "text-oboya-blue-dark"
            : "text-white";
          const showCounter =
            isActive && (reduceMotion || counterReadyIndex === index);

          return (
            <motion.button
              key={stat.id}
              type="button"
              aria-label={`${label}: ${stat.pending ? "XX" : `${stat.value}${stat.suffix}`}`}
              aria-pressed={isActive}
              onClick={() => goTo(index)}
              initial={false}
              animate={{
                flexGrow: isActive ? 1 : 0,
                flexBasis: isActive ? "0%" : COLLAPSED_BASIS,
              }}
              transition={cardTransition}
              className={cn(
                "group relative min-w-0 overflow-hidden rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/60 focus-visible:ring-offset-2",
                SQUEEZE_CARD_SURFACE_CLASS,
                isActive ? "cursor-default" : "cursor-pointer"
              )}
              style={{ flexShrink: 0, zIndex: squeezeCardZIndex(isActive) }}
            >
              <div
                className={cn(
                  "absolute inset-0 overflow-hidden bg-oboya-soft-white",
                  SQUEEZE_MEDIA_LAYER_CLASS
                )}
              >
                <Image
                  src={stat.image.src}
                  alt={pickLocalized(stat.image.alt, locale)}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1280px) 50vw, 33vw"
                  className={cn(
                    "object-cover",
                    !isActive &&
                      !reduceMotion &&
                      "transition-transform duration-500 ease-out group-hover:scale-[1.04] [@media(hover:none)]:group-hover:scale-100"
                  )}
                  style={{ objectPosition: stat.objectPosition ?? "center" }}
                />
              </div>

              <motion.div
                aria-hidden
                initial={false}
                animate={{ opacity: isActive ? 0 : 0.92 }}
                transition={layerTransition}
                className="absolute inset-0"
                style={{ backgroundColor: accent }}
              />

              <motion.div
                aria-hidden
                initial={false}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={layerTransition}
                className="absolute inset-0 bg-gradient-to-t from-oboya-blue-dark/25 to-transparent"
              />

              <motion.div
                className="pointer-events-none absolute inset-0 z-[3] flex flex-col"
                initial={false}
                animate={iconMotionDesktop(isActive)}
                transition={iconTransition}
              >
                <span
                  className="flex size-8 items-center justify-center rounded-full bg-white/95 shadow-sm sm:size-9"
                  aria-hidden
                >
                  <Icon
                    className="size-4 sm:size-5"
                    strokeWidth={1.6}
                    style={{ color: accent }}
                  />
                </span>
                <motion.div
                  initial={false}
                  animate={squeezeCollapsedPanelOpacity(isActive)}
                  transition={squeezePanelTransition(reduce, !isActive)}
                  className={cn(isActive && "pointer-events-none")}
                  aria-hidden={isActive}
                >
                  <MetricValue
                    stat={stat}
                    label={label}
                    reduceMotion={reduce}
                    animate={false}
                    className={cn(
                      "font-display text-[clamp(1.05rem,1.6vw,1.35rem)] font-light leading-none tracking-tight [writing-mode:vertical-rl] rotate-180",
                      collapsedInk
                    )}
                  />
                </motion.div>
              </motion.div>

              <motion.div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[2]"
                initial={false}
                animate={squeezeExpandedPanelOpacity(isActive)}
                transition={squeezePanelTransition(reduce, isActive)}
                aria-hidden={!isActive}
              >
                <div
                  className="flex w-full items-center gap-x-4 px-6 py-5 md:gap-x-5 md:px-7 md:py-6 lg:px-8"
                  style={{ backgroundColor: `${accent}99` }}
                >
                  <p className="min-w-0 flex-1 overflow-hidden font-body text-sm leading-snug text-white md:text-[0.9375rem]">
                    {label}
                  </p>
                  <MetricValue
                    stat={stat}
                    label={label}
                    reduceMotion={reduce}
                    animate={showCounter}
                    className="shrink-0 text-right font-display text-[clamp(2.5rem,5vw,3.75rem)] font-light leading-none tracking-tight text-white tabular-nums"
                  />
                </div>
              </motion.div>
            </motion.button>
          );
        })}
      </div>
      </LayoutGroup>

      <LayoutGroup id="numbers-squeeze-mobile">
      <div
        className={cn(
          "flex h-[min(42rem,80svh)] flex-col gap-2 md:hidden",
          "focus-within:outline-none"
        )}
        style={{
          minHeight: `calc(${MOBILE_EXPANDED_BASIS} + ${MOBILE_COLLAPSED_BASIS} * ${Math.max(0, count - 1)})`,
        }}
      >
        {stats.map((stat, index) => {
          const isActive = index === activeIndex;
          const label = pickLocalized(stat.label, locale);
          const Icon = ICON_MAP[stat.icon] ?? Globe2;
          const accent = stat.accentColor || "#4DAF4E";
          const showCounter =
            isActive && (reduceMotion || counterReadyIndex === index);

          return (
            <motion.button
              key={stat.id}
              type="button"
              aria-label={`${label}: ${stat.pending ? "XX" : `${stat.value}${stat.suffix}`}`}
              aria-expanded={isActive}
              onClick={() => goTo(index)}
              initial={false}
              animate={{
                flexGrow: isActive ? 1 : 0,
                flexBasis: isActive ? MOBILE_EXPANDED_BASIS : MOBILE_COLLAPSED_BASIS,
              }}
              transition={cardTransition}
              className={cn(
                "relative min-h-0 w-full overflow-hidden rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/60 focus-visible:ring-offset-2",
                SQUEEZE_CARD_SURFACE_CLASS,
                isActive ? "min-h-[16rem] cursor-default" : "cursor-pointer"
              )}
              style={{ flexShrink: 0, zIndex: squeezeCardZIndex(isActive) }}
            >
              <div
                className={cn(
                  "absolute inset-0 overflow-hidden bg-oboya-soft-white",
                  SQUEEZE_MEDIA_LAYER_CLASS
                )}
              >
                <Image
                  src={stat.image.src}
                  alt={pickLocalized(stat.image.alt, locale)}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover"
                  style={{ objectPosition: stat.objectPosition ?? "center" }}
                />
              </div>

              <motion.div
                aria-hidden
                initial={false}
                animate={{ opacity: isActive ? 0 : 0.92 }}
                transition={layerTransition}
                className="absolute inset-0"
                style={{ backgroundColor: accent }}
              />

              <motion.div
                aria-hidden
                initial={false}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={layerTransition}
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-oboya-blue-dark/50 via-transparent to-transparent"
              />

              <motion.div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[2]"
                initial={false}
                animate={squeezeExpandedPanelOpacity(isActive)}
                transition={squeezePanelTransition(reduce, isActive)}
                aria-hidden={!isActive}
              >
                <div
                  className="flex w-full items-center gap-3 px-4 py-4"
                  style={{ backgroundColor: `${accent}99` }}
                >
                  <p className="min-w-0 flex-1 font-body text-sm leading-snug text-white">
                    {label}
                  </p>
                  <MetricValue
                    stat={stat}
                    label={label}
                    reduceMotion={reduce}
                    animate={showCounter}
                    className="shrink-0 text-right font-display text-[clamp(2rem,10vw,2.75rem)] font-light leading-none tracking-tight text-white tabular-nums"
                  />
                </div>
              </motion.div>

              <motion.div
                className="pointer-events-none absolute inset-0 z-[3] flex items-start gap-3"
                initial={false}
                animate={iconMotionMobile()}
                transition={iconTransition}
              >
                <div className="flex w-full min-w-0 items-center gap-3">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-sm"
                  aria-hidden
                >
                  <Icon
                    className="size-4"
                    strokeWidth={1.6}
                    style={{ color: accent }}
                  />
                </span>
                <motion.div
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-3 overflow-hidden",
                    isActive && "pointer-events-none !w-0 !min-w-0 !flex-[0]"
                  )}
                  initial={false}
                  animate={squeezeCollapsedPanelOpacity(isActive)}
                  transition={squeezePanelTransition(reduce, !isActive)}
                  aria-hidden={isActive}
                >
                  <p
                    className="min-w-0 flex-1 truncate font-body text-sm font-medium leading-snug text-white"
                  >
                    {label}
                  </p>
                  <MetricValue
                    stat={stat}
                    label={label}
                    reduceMotion={Boolean(reduceMotion)}
                    animate={false}
                    className="shrink-0 font-display text-lg font-light leading-none tracking-tight text-white"
                  />
                </motion.div>
                </div>
              </motion.div>
            </motion.button>
          );
        })}
      </div>
      </LayoutGroup>
    </div>
  );
}
