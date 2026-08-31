"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
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
import { easeOutExpo } from "@/lib/animations";
import type {
  AboutImpactStatIcon,
  AboutPageSettings,
} from "@/lib/cms/repositories/about-page-repository";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 48;
const EASE = [...easeOutExpo] as [number, number, number, number];
const BANNER_TRANSITION_S = 0.5;
const AUTOPLAY_MS = 4200;

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

function useIsDesktopSqueeze() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

function isLightAccent(hex: string) {
  return LIGHT_ACCENTS.has(hex.trim().toLowerCase());
}

function MetricValue({
  stat,
  label,
  reduceMotion,
  className,
}: {
  stat: ImpactStat;
  label: string;
  reduceMotion: boolean;
  className?: string;
}) {
  if (stat.pending) {
    return (
      <span className={className} aria-label={`${label}: data pending`}>
        XX
      </span>
    );
  }

  if (reduceMotion) {
    return (
      <span className={className}>
        {stat.value}
        {stat.suffix}
      </span>
    );
  }

  return (
    <span className={className}>
      <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2.2} />
    </span>
  );
}

export function NumbersSqueezeCarousel({
  stats,
  locale,
}: NumbersSqueezeCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const isDesktop = useIsDesktopSqueeze();
  const pointerStartX = useRef<number | null>(null);
  const pointerDeltaX = useRef(0);
  const mobileTrackRef = useRef<HTMLDivElement>(null);

  const count = stats.length;
  const activeStat = stats[activeIndex] ?? stats[0];

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      setActiveIndex(((index % count) + count) % count);
    },
    [count]
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => {
    if (isDesktop || !mobileTrackRef.current) return;
    const el = mobileTrackRef.current.children[activeIndex] as
      | HTMLElement
      | undefined;
    el?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeIndex, isDesktop, reduceMotion]);

  // Autoplay — pause on hover/focus and when reduced motion is preferred
  useEffect(() => {
    if (reduceMotion || paused || count < 2) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, paused, reduceMotion]);

  const onPointerDown = (event: ReactPointerEvent) => {
    if (isDesktop) return;
    pointerStartX.current = event.clientX;
    pointerDeltaX.current = 0;
  };

  const onPointerMove = (event: ReactPointerEvent) => {
    if (pointerStartX.current == null) return;
    pointerDeltaX.current = event.clientX - pointerStartX.current;
  };

  const onPointerUp = () => {
    if (pointerStartX.current == null) return;
    const delta = pointerDeltaX.current;
    pointerStartX.current = null;
    pointerDeltaX.current = 0;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta < 0) goNext();
    else goPrev();
  };

  if (count === 0 || !activeStat) return null;

  const bannerTransition = reduceMotion
    ? { duration: 0 }
    : { duration: BANNER_TRANSITION_S, ease: EASE };

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

      {/* Desktop / tablet squeeze — proportional grow fills wide monitors */}
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

          return (
            <motion.button
              key={stat.id}
              type="button"
              aria-label={`${label}: ${stat.pending ? "XX" : `${stat.value}${stat.suffix}`}`}
              aria-pressed={isActive}
              onClick={() => goTo(index)}
              initial={false}
              animate={{
                flexGrow: isActive ? 7 : 1,
                flexBasis: 0,
              }}
              transition={bannerTransition}
              className={cn(
                "group relative min-w-0 overflow-hidden rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/60 focus-visible:ring-offset-2",
                isActive
                  ? "min-w-[12rem] cursor-default"
                  : "min-w-[3.75rem] cursor-pointer"
              )}
              style={{ flexShrink: 1 }}
            >
              <div className="absolute inset-0 bg-oboya-soft-white">
                <Image
                  src={stat.image.src}
                  alt={pickLocalized(stat.image.alt, locale)}
                  fill
                  priority={index === 0}
                  sizes={
                    isActive
                      ? "(max-width: 1024px) 70vw, 55vw"
                      : "(max-width: 1024px) 12vw, 8vw"
                  }
                  className={cn(
                    "object-cover transition-transform duration-500 ease-out",
                    !isActive &&
                      !reduceMotion &&
                      "group-hover:scale-[1.04] [@media(hover:none)]:group-hover:scale-100"
                  )}
                  style={{ objectPosition: stat.objectPosition ?? "center" }}
                />
              </div>

              <div
                aria-hidden
                className={cn(
                  "absolute inset-0 transition-opacity duration-300",
                  isActive ? "opacity-0" : "opacity-[0.92]"
                )}
                style={{ backgroundColor: accent }}
              />

              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-t from-oboya-blue-dark/25 to-transparent transition-opacity duration-300",
                  isActive ? "opacity-100" : "opacity-0"
                )}
              />

              <div
                className={cn(
                  "absolute inset-0 z-[2] flex flex-col items-center justify-between px-1.5 py-5 transition-opacity duration-300",
                  isActive ? "pointer-events-none opacity-0" : "opacity-100"
                )}
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
                <MetricValue
                  stat={stat}
                  label={label}
                  reduceMotion={Boolean(reduceMotion)}
                  className={cn(
                    "font-display text-[clamp(1.05rem,1.6vw,1.35rem)] font-light leading-none tracking-tight [writing-mode:vertical-rl] rotate-180",
                    collapsedInk
                  )}
                />
              </div>

              <div
                className={cn(
                  "pointer-events-none absolute left-0 top-0 z-[2] p-6 transition-opacity md:p-7 lg:p-8",
                  isActive ? "opacity-100" : "opacity-0"
                )}
                style={{
                  width: "min(32rem, 52vw)",
                  transitionDuration: reduceMotion
                    ? "0ms"
                    : `${BANNER_TRANSITION_S * 1000}ms`,
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                aria-hidden={!isActive}
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
              </div>

              <div
                className={cn(
                  "pointer-events-none absolute inset-x-0 bottom-0 z-[2] px-6 py-5 md:px-7 md:py-6 lg:px-8",
                  isActive ? "opacity-100" : "opacity-0"
                )}
                style={{ backgroundColor: `${accent}99` }}
                aria-hidden={!isActive}
              >
                <div
                  className="flex items-end gap-x-4"
                  style={{ width: "min(28rem, 52vw)" }}
                >
                  <MetricValue
                    stat={stat}
                    label={label}
                    reduceMotion={Boolean(reduceMotion)}
                    className="shrink-0 font-display text-[clamp(2.5rem,5vw,3.75rem)] font-light leading-none tracking-tight text-white"
                  />
                  <p className="w-[11rem] shrink-0 pb-1 font-body text-sm leading-snug text-white md:text-[0.9375rem]">
                    {label}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Mobile snap carousel */}
      <div
        ref={mobileTrackRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {stats.map((stat, index) => {
          const isActive = index === activeIndex;
          const label = pickLocalized(stat.label, locale);
          const Icon = ICON_MAP[stat.icon] ?? Globe2;
          const accent = stat.accentColor || "#4DAF4E";

          return (
            <button
              key={stat.id}
              type="button"
              aria-label={`${label}: ${stat.pending ? "XX" : `${stat.value}${stat.suffix}`}`}
              aria-pressed={isActive}
              onClick={() => goTo(index)}
              className={cn(
                "relative aspect-[4/5] w-[78%] shrink-0 snap-center overflow-hidden rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/60 focus-visible:ring-offset-2",
                !isActive && "opacity-95"
              )}
            >
              <Image
                src={stat.image.src}
                alt={pickLocalized(stat.image.alt, locale)}
                fill
                priority={index === 0}
                sizes="92vw"
                className="object-cover"
                style={{ objectPosition: stat.objectPosition ?? "center" }}
              />
              <div
                className="absolute inset-0 opacity-35"
                style={{ backgroundColor: accent }}
                aria-hidden
              />
              <div className="absolute inset-0 bg-gradient-to-t from-oboya-blue-dark/50 via-transparent to-transparent" />
              <div className="absolute inset-0 flex flex-col">
                <div className="p-5">
                  <span
                    className="flex size-9 items-center justify-center rounded-full bg-white/95 shadow-sm"
                    aria-hidden
                  >
                    <Icon
                      className="size-5"
                      strokeWidth={1.6}
                      style={{ color: accent }}
                    />
                  </span>
                </div>
                <div
                  className="mt-auto px-5 py-4"
                  style={{ backgroundColor: `${accent}99` }}
                >
                  <div className="flex items-end gap-x-3">
                    <MetricValue
                      stat={stat}
                      label={label}
                      reduceMotion={Boolean(reduceMotion)}
                      className="shrink-0 font-display text-[clamp(2.25rem,10vw,3rem)] font-light leading-none tracking-tight text-white"
                    />
                    <p className="w-[9.5rem] shrink-0 pb-1 font-body text-sm leading-snug text-white">
                      {label}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
