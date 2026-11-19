"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Leaf,
  Package,
  ShoppingCart,
  Sprout,
  Store,
  Truck,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { pickLocalized } from "@/lib/cms/utils";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { describeArc } from "@/lib/geometry/arc";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  propagation: Sprout,
  growing: Leaf,
  harvest: Wheat,
  packaging: Package,
  logistics: Truck,
  retail: Store,
  pos: ShoppingCart,
};

const SWIPE_THRESHOLD = 48;
const SPRING_MS = 700;
const PILL_HALF_H = 24;

function wrap(index: number, count: number) {
  return ((index % count) + count) % count;
}

/** Ecosystem journey: arc of stage pills around a half-circle photo, driven only by prev/next. */
export function HomeEcosystemSection({
  data,
  locale,
  animationsEnabled,
}: {
  data: HomepageSettings["homeEcosystem"];
  locale: string;
  animationsEnabled: boolean;
}) {
  const t = useTranslations("homeEcosystem");
  const reduceMotion = useReducedMotion();
  const still = Boolean(reduceMotion) || !animationsEnabled;
  const frameRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);
  const locked = useRef(false);
  const lockTimer = useRef<number | undefined>(undefined);
  const [width, setWidth] = useState(0);
  const [state, setState] = useState({ active: 0, prev: 0, wraps: [] as number[] });

  const pick = (v: HomepageSettings["homeEcosystem"]["title"]) => pickLocalized(v, locale);
  const stages = data.stages;
  const count = stages.length;
  const half = Math.floor(count / 2);
  const slot = useCallback((i: number, a: number) => wrap(i - a + half, count) - half, [half, count]);
  const { active, prev } = state;
  const isLast = active === count - 1;
  const bodyParagraphs = [pick(data.bodyP1), pick(data.bodyP2)];

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setWidth(frame.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => {
      observer.disconnect();
      window.clearTimeout(lockTimer.current);
    };
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (locked.current || count < 2) return;
      if (!still) {
        locked.current = true;
        lockTimer.current = window.setTimeout(() => {
          locked.current = false;
        }, SPRING_MS);
      }
      setState((s) => {
        const next = wrap(s.active + dir, count);
        const wraps = Array.from({ length: count }, (_, i) =>
          (s.wraps[i] ?? 0) + (Math.abs(slot(i, next) - slot(i, s.active)) > 1 ? 1 : 0),
        );
        return { active: next, prev: s.active, wraps };
      });
    },
    [count, slot, still],
  );

  const m = useMemo(() => {
    const w = Math.max(width, 320);
    const mode = w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
    const R =
      mode === "desktop" ? Math.min(0.375 * w, 500) : mode === "tablet" ? 0.42 * w : 0.48 * w;
    // Wider step on narrow desktops (smaller R) so neighbouring pills never touch.
    const step =
      mode === "desktop" ? 27 + 3 * Math.min(Math.max((480 - R) / 96, 0), 1) : mode === "tablet" ? 31 : w < 380 ? 38 : 40;
    const photoR = R - (mode === "desktop" ? 140 : mode === "tablet" ? 120 : w < 640 ? 70 : 105);
    const haloR = photoR + (mode === "desktop" ? 32 : mode === "tablet" ? 24 : 14);
    const reach = mode === "mobile" ? 1 : mode === "tablet" ? 2 : half;
    const height = R + PILL_HALF_H + 16;
    const arc = describeArc(w / 2, height, R, -(reach * step + 6), reach * step + 6);
    return { w, mode, R, step, photoR, haloR, reach, height, arc };
  }, [width, half]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const start = pointerStartX.current;
    pointerStartX.current = null;
    if (start == null) return;
    const delta = e.clientX - start;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    go(delta < 0 ? 1 : -1);
  };

  const activeStage = stages[active];
  const label = (i: number) => pick(stages[i].label);
  const spring = still
    ? { duration: 0 }
    : ({ type: "spring", duration: SPRING_MS / 1000, bounce: 0.12 } as const);

  const navBtn =
    "flex size-10 items-center sm:size-12 justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80";

  return (
    <section
      aria-label={t("ariaLabel")}
      data-eco-active={activeStage?.id}
      className="relative z-10 overflow-x-clip bg-oboya-blue-dark pt-8 lg:pt-10"
    >
      <div
        ref={frameRef}
        className="relative mx-auto w-full max-w-[var(--container-max)] touch-pan-y [container-type:inline-size]"
        onPointerDown={(e) => {
          pointerStartX.current = e.clientX;
        }}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          pointerStartX.current = null;
        }}
      >
        {activeStage ? (
          <div
            className={cn(
              "relative h-[calc(48cqw+40px)] w-full md:h-[calc(42cqw+40px)] lg:h-[calc(min(37.5cqw,500px)+40px)]",
              !width && "invisible",
            )}
          >
            <svg
              className="pointer-events-none absolute inset-0 size-full overflow-visible"
              viewBox={`0 0 ${m.w} ${m.height}`}
              aria-hidden
            >
              <path
                d={m.arc}
                fill="none"
                stroke="var(--oboya-green)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Halo + half-circle photo, flat base on the chord */}
            <div
              className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-full bg-oboya-blue/35"
              style={{ width: m.haloR * 2, height: m.haloR }}
              aria-hidden
            />
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 overflow-hidden rounded-t-full bg-oboya-blue-dark"
              style={{ width: m.photoR * 2, height: m.photoR }}
            >
              <AnimatePresence initial={false}>
                <motion.div
                  key={activeStage.id}
                  className="absolute inset-0"
                  initial={still ? false : { opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: still ? 0 : 0.6, ease: "easeOut" }}
                >
                  <Image
                    src={activeStage.image}
                    alt={label(active)}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 80vw, 720px"
                    priority={active === 0}
                  />
                  <div
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,color-mix(in_srgb,var(--oboya-blue-dark)_35%,transparent),transparent_70%)]"
                    aria-hidden
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <ol className="absolute inset-0 m-0 list-none p-0">
              {stages.map((stage, i) => {
                const s = slot(i, active);
                const wrapped = Math.abs(s - slot(i, prev)) > 1;
                const angle = s * m.step;
                const visible = Math.abs(s) <= m.reach;
                const Icon = ICONS[stage.id] ?? Sprout;
                const isActive = s === 0;
                return (
                  <motion.li
                    key={`${stage.id}-${state.wraps[i] ?? 0}`}
                    className="absolute left-1/2 size-0"
                    style={{ top: m.height }}
                    initial={{ rotate: angle }}
                    animate={{ rotate: angle }}
                    transition={wrapped ? { duration: 0 } : spring}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <motion.div
                      className={cn(
                        "absolute left-0 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-l-full rounded-tr-full rounded-br-[4px] py-1 pl-1 pr-2.5 text-[9px] font-semibold text-white transition-colors duration-500 sm:gap-2 sm:pr-4 sm:text-xs lg:text-sm",
                        isActive
                          ? "bg-oboya-blue-light shadow-[0_0_28px_color-mix(in_srgb,var(--oboya-blue-light)_55%,transparent)]"
                          : "bg-oboya-blue",
                      )}
                      style={{ top: -m.R }}
                      initial={{ rotate: -angle, opacity: wrapped && !still ? 0 : visible ? 1 : 0 }}
                      animate={{ rotate: -angle, opacity: visible ? 1 : 0 }}
                      transition={wrapped ? { rotate: { duration: 0 }, opacity: { duration: still ? 0 : 0.5 } } : spring}
                    >
                      <span className="flex size-6 shrink-0 sm:size-9 items-center justify-center rounded-full bg-oboya-blue-dark">
                        <Icon className="size-3 text-oboya-green-light sm:size-[18px]" strokeWidth={2} aria-hidden />
                      </span>
                      <span>
                        {label(i)}
                      </span>
                    </motion.div>
                  </motion.li>
                );
              })}
            </ol>

            <div
              role="group"
              aria-label={t("controls")}
              onKeyDown={onKeyDown}
              className="absolute bottom-3 left-1/2 sm:bottom-5 z-10 flex -translate-x-1/2 gap-2 sm:gap-3"
            >
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label={t("prev")}
                className={cn(navBtn, "bg-white text-oboya-blue-dark hover:bg-white/85")}
              >
                <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label={isLast ? t("restart", { label: label(0) }) : t("next")}
                className={cn(navBtn, "bg-white text-oboya-blue-dark hover:bg-white/85")}
              >
                <ChevronRight className="size-6" strokeWidth={2.25} aria-hidden />
              </button>
            </div>

            <p className="sr-only" aria-live="polite">
              {t("stageStatus", { label: label(active), current: active + 1, total: count })}
            </p>
          </div>
        ) : null}
      </div>

      {/* Closing line bar */}
      <div className="bg-oboya-blue px-[var(--container-padding)] py-6 text-center md:py-8">
        <p className="mx-auto max-w-4xl font-display text-[clamp(1.1rem,2.2vw,1.75rem)] font-light leading-snug text-white text-balance">
          {pick(data.closingLine1)} {pick(data.closingLine2)}
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-12 px-[var(--container-padding)] py-[var(--section-y)] md:gap-14">
        {/* Header row: title and body close the section, under the plate and rail */}
        <div className="grid grid-cols-12 gap-x-6 gap-y-6 border-t border-white/15 pt-10 md:pt-12">
          <h2 className="col-span-12 max-w-xl whitespace-pre-line font-display text-[clamp(1.45rem,2.8vw,2.25rem)] font-light leading-[1.3] tracking-tight text-white text-balance lg:col-span-5">
            {pick(data.title)}
          </h2>
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-7 lg:pt-1">
            {bodyParagraphs.map((paragraph, index) => (
              <p
                key={index}
                className="font-body text-[clamp(0.975rem,1.4vw,1.125rem)] font-light leading-[1.65] text-white/90 text-pretty"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
