"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { fadeInUp, revealViewport } from "@/lib/animations";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";
import { solutionsHrefForBusinessCard } from "@/lib/solutions/solutions-data";

const GAP = 20;
const SWIPE_THRESHOLD = 48;
const SPRING_MS = 700;

function wrap(index: number, count: number) {
  return ((index % count) + count) % count;
}

function cardWidthFor(w: number) {
  if (w < 640) return w * 0.78;
  if (w < 1024) return w * 0.48;
  return Math.min(w * 0.32, 480);
}

/** The active card grows; neighbours shrink a little. */
const ACTIVE_SCALE = 1.08;
const SIDE_SCALE = 0.94;

interface BusinessSolutionsProps {
  data: HomepageSettings["businessSolutions"];
  locale: string;
  animationsEnabled?: boolean;
}

/** Card carousel: active card centred with a light-blue label, driven only by prev/next. */
export function BusinessSolutions({
  data,
  locale,
  animationsEnabled = true,
}: BusinessSolutionsProps) {
  const t = useTranslations("common");
  const reduceMotion = useReducedMotion();
  const still = Boolean(reduceMotion) || !animationsEnabled;
  const items = data.items;
  const count = items.length;
  const half = Math.floor(count / 2);
  const frameRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);
  const swiped = useRef(false);
  const locked = useRef(false);
  const lockTimer = useRef<number | undefined>(undefined);
  const [width, setWidth] = useState(0);
  const [state, setState] = useState({ active: 0, prev: 0 });
  const { active, prev } = state;

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
      setState((s) => ({ active: wrap(s.active + dir, count), prev: s.active }));
    },
    [count, still],
  );

  if (count === 0) return null;

  const slot = (i: number, a: number) => wrap(i - a + half, count) - half;
  const cardW = cardWidthFor(width || 360);
  const cardH = cardW * (8 / 7);
  // Extra spacing so the enlarged active card never touches its neighbours.
  const step = cardW * ((ACTIVE_SCALE + SIDE_SCALE) / 2) + GAP;
  const frameH = cardH * ACTIVE_SCALE;
  const spring = still
    ? { duration: 0 }
    : ({ type: "spring", duration: SPRING_MS / 1000, bounce: 0.1 } as const);

  const onPointerUp = (e: React.PointerEvent) => {
    const start = pointerStartX.current;
    pointerStartX.current = null;
    if (start == null) return;
    const delta = e.clientX - start;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      swiped.current = true;
      go(delta < 0 ? 1 : -1);
    }
  };

  const navBtn =
    "flex size-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-blue-light sm:size-12";

  return (
    <section className="overflow-x-clip bg-oboya-soft-white py-[var(--section-y)]">
      <Container>
        <motion.div
          initial={animationsEnabled ? "hidden" : false}
          whileInView={animationsEnabled ? "visible" : undefined}
          viewport={revealViewport}
          variants={fadeInUp}
          className="mb-8 md:mb-12"
        >
          <div className="mb-5 flex items-center gap-4">
            <p className="shrink-0 text-sm font-semibold tracking-wide text-oboya-blue-dark">
              {pickLocalized(data.eyebrow, locale)}
            </p>
            <div className="h-px flex-1 bg-oboya-blue-dark/25" aria-hidden />
          </div>
          <h2 className="max-w-4xl font-display text-[clamp(1.45rem,2.8vw,2.25rem)] font-light leading-[1.3] tracking-tight text-oboya-blue-dark text-balance">
            {pickLocalized(data.title, locale)}
          </h2>
        </motion.div>
      </Container>

      <div
        ref={frameRef}
        className="relative w-full touch-pan-y select-none"
        style={{ height: frameH }}
        onPointerDown={(e) => {
          pointerStartX.current = e.clientX;
          swiped.current = false;
        }}
        onClickCapture={(e) => {
          if (swiped.current) {
            e.preventDefault();
            e.stopPropagation();
            swiped.current = false;
          }
        }}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          pointerStartX.current = null;
        }}
      >
        <ul className="m-0 list-none p-0">
          {items.map((item, i) => {
            const s = slot(i, active);
            const wrapped = Math.abs(s - slot(i, prev)) > 1;
            const isActive = s === 0;
            const visible = Math.abs(s) <= 2;
            const title = pickLocalized(item.title, locale);
            const description = pickLocalized(item.description, locale);
            const cta =
              item.ctaLabel != null
                ? pickLocalized(item.ctaLabel, locale)
                : t("a11y.exploreSolutions");
            const href = solutionsHrefForBusinessCard({ id: item.id, href: item.href, title });
            return (
              <motion.li
                key={item.id}
                className={cn(
                  "absolute overflow-hidden rounded-none shadow-[0_12px_40px_rgba(1,32,63,0.25)]",
                  isActive ? "z-10" : "z-0",
                )}
                style={{
                  width: cardW,
                  height: cardH,
                  left: `calc(50% - ${cardW / 2}px)`,
                  top: (frameH - cardH) / 2,
                }}
                initial={false}
                animate={{
                  x: s * step,
                  scale: isActive ? ACTIVE_SCALE : SIDE_SCALE,
                  opacity: !visible ? 0 : isActive ? 1 : 0.45,
                }}
                transition={wrapped ? { x: { duration: 0 }, opacity: { duration: still ? 0 : 0.5 } } : spring}
                aria-current={isActive ? "true" : undefined}
                aria-hidden={!visible || undefined}
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={isActive ? title : ""}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 52vw, 520px"
                  />
                ) : (
                  <div className="absolute inset-0 bg-oboya-blue-dark" />
                )}
                <div className="absolute inset-0 bg-black/50" aria-hidden />
                {/* Anchored to the bottom so long copy grows upwards instead of being cut off. */}
                <div className="absolute inset-x-0 bottom-0 top-[30%] flex flex-col items-start justify-end px-6 pb-7 text-white sm:px-8 sm:pb-9">
                  <h3 className="font-display text-[clamp(1.25rem,1.9vw,1.875rem)] font-semibold leading-tight">
                    {title}
                  </h3>
                  <p className="mt-3 text-[clamp(0.9rem,1.05vw,1.0625rem)] leading-snug sm:mt-4">
                    {description}
                  </p>
                  <Link
                    href={href}
                    tabIndex={isActive ? 0 : -1}
                    className={cn(
                      "mt-5 inline-flex items-center text-base font-medium text-white sm:mt-6",
                      !isActive && "pointer-events-none",
                    )}
                  >
                    <span className="underline decoration-2 underline-offset-4">{cta}</span>
                    <ArrowRight className="ml-5 size-5" aria-hidden />
                  </Link>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <p className="sr-only" aria-live="polite">
        {t("a11y.solutionsStatus", {
          n: active + 1,
          total: count,
          title: pickLocalized(items[active].title, locale),
        })}
      </p>

      <div
        role="group"
        aria-label={t("a11y.solutionsControls")}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          else if (e.key === "ArrowLeft") go(-1);
        }}
        className="mt-8 flex justify-center gap-2 sm:gap-3 md:mt-10"
      >
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label={t("a11y.previousSolutions")}
          className={cn(navBtn, "bg-oboya-blue-dark text-white hover:bg-oboya-blue-dark/85")}
        >
          <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label={t("a11y.nextSolutions")}
          className={cn(navBtn, "bg-oboya-blue-dark text-white hover:bg-oboya-blue-dark/85")}
        >
          <ChevronRight className="size-6" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </section>
  );
}
