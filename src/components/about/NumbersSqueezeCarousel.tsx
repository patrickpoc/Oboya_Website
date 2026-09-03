"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
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
import {
  SQUEEZE_BANNER_S,
  SQUEEZE_CARD_SURFACE_CLASS,
  SQUEEZE_MEDIA_LAYER_CLASS,
  squeezeLayerTransition,
  squeezeLayoutTransition,
} from "@/lib/squeeze-carousel-motion";
import type {
  AboutImpactStatIcon,
  AboutPageSettings,
} from "@/lib/cms/repositories/about-page-repository";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";
import { easeOutExpo } from "@/lib/animations";

const COLLAPSED_H = "4.25rem";
const EXPANDED_H = "22.25rem";
const ICON_INSET_Y = "1.125rem";
const ICON_INSET_X = "1rem";
const STRIP_CONTENT_PAD_L = "3.75rem";

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

function MetricValue({
  stat,
  label,
  className,
}: {
  stat: ImpactStat;
  label: string;
  className?: string;
}) {
  if (stat.pending) {
    return (
      <span className={className} aria-label={`${label}: data pending`}>
        XX
      </span>
    );
  }

  return (
    <span className={className}>
      {stat.value}
      {stat.suffix}
    </span>
  );
}

export function NumbersSqueezeCarousel({
  stats,
  locale,
}: NumbersSqueezeCarouselProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  const count = stats.length;
  const activeStat =
    activeIndex != null ? (stats[activeIndex] ?? null) : null;

  const toggle = useCallback(
    (index: number) => {
      if (count === 0) return;
      const next = ((index % count) + count) % count;
      setActiveIndex((prev) => (prev === next ? null : next));
    },
    [count]
  );

  if (count === 0) return null;

  const reduce = Boolean(reduceMotion);
  const dropTransition = squeezeLayoutTransition(reduce);
  const layerTransition = squeezeLayerTransition(reduce);

  return (
    <div className="relative w-full">
      {activeStat ? (
        <p className="sr-only" aria-live="polite">
          {pickLocalized(activeStat.label, locale)}
        </p>
      ) : null}

      <div className="flex w-full flex-col gap-2 focus-within:outline-none">
        {stats.map((stat, index) => {
          const isActive = index === activeIndex;
          const label = pickLocalized(stat.label, locale);
          const Icon = ICON_MAP[stat.icon] ?? Globe2;
          const accent = stat.accentColor || "#4DAF4E";

          return (
            <motion.button
              key={stat.id}
              type="button"
              aria-label={`${label}: ${stat.pending ? "XX" : `${stat.value}${stat.suffix}`}`}
              aria-expanded={isActive}
              onClick={() => toggle(index)}
              initial={false}
              animate={{ height: isActive ? EXPANDED_H : COLLAPSED_H }}
              transition={dropTransition}
              className={cn(
                "relative w-full cursor-pointer overflow-hidden rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/60 focus-visible:ring-offset-2",
                SQUEEZE_CARD_SURFACE_CLASS
              )}
              style={{ flexShrink: 0 }}
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
                className="absolute inset-0 z-0"
                style={{ backgroundColor: accent }}
              />

              <motion.div
                aria-hidden
                initial={false}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={layerTransition}
                className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-oboya-blue-dark/50 via-transparent to-transparent"
              />

              <div
                className="pointer-events-none absolute z-[4]"
                style={{ top: ICON_INSET_Y, left: ICON_INSET_X }}
                aria-hidden
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-white/95 shadow-sm">
                  <Icon
                    className="size-4"
                    strokeWidth={1.6}
                    style={{ color: accent }}
                  />
                </span>
              </div>

              <motion.div
                className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-3 overflow-visible pr-4 md:pr-5"
                style={{
                  height: COLLAPSED_H,
                  paddingLeft: STRIP_CONTENT_PAD_L,
                }}
                initial={false}
                animate={{ opacity: isActive ? 0 : 1 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : isActive
                      ? {
                          type: "tween",
                          duration: SQUEEZE_BANNER_S * 0.28,
                          ease: [...easeOutExpo] as [
                            number,
                            number,
                            number,
                            number,
                          ],
                        }
                      : dropTransition
                }
                aria-hidden={isActive}
              >
                <p className="min-w-0 flex-1 truncate font-body text-sm font-medium leading-snug text-white md:text-[0.9375rem]">
                  {label}
                </p>
                <MetricValue
                  stat={stat}
                  label={label}
                  className="shrink-0 font-display text-xl font-semibold leading-snug tracking-tight text-white tabular-nums md:text-2xl"
                />
              </motion.div>

              <motion.div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[2]"
                initial={false}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={dropTransition}
                aria-hidden={!isActive}
              >
                <div
                  className="flex w-full items-center gap-3 px-4 py-4 md:gap-x-5 md:px-7 md:py-6"
                  style={{ backgroundColor: `${accent}99` }}
                >
                  <p className="min-w-0 flex-1 font-body text-sm leading-snug text-white md:text-[0.9375rem]">
                    {label}
                  </p>
                  <MetricValue
                    stat={stat}
                    label={label}
                    className="shrink-0 text-right font-display text-[clamp(2rem,6vw,3.5rem)] font-light leading-none tracking-tight text-white tabular-nums"
                  />
                </div>
              </motion.div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
