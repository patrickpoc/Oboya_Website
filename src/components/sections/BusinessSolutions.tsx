"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  if (w < 640) return w * 0.72;
  if (w < 1024) return w * 0.42;
  return Math.min(w * 0.28, 420);
}

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
  const cardH = cardW * (width < 640 ? 1.25 : 4 / 3);
  const step = cardW + GAP;
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
        style={{ height: cardH }}
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
                className="absolute top-0 overflow-hidden rounded-2xl"
                style={{ width: cardW, height: cardH, left: `calc(50% - ${cardW / 2}px)` }}
                initial={false}
                animate={{ x: s * step, opacity: !visible ? 0 : isActive ? 1 : 0.45 }}
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
                    sizes="(max-width: 640px) 72vw, 28vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-oboya-blue-dark" />
                )}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10"
                  aria-hidden
                />
                <div className="absolute inset-0 flex flex-col items-start justify-end p-5 md:p-6">
                  <h3
                    className={cn(
                      "rounded-l-full rounded-tr-full rounded-br-[4px] px-4 py-1.5 text-xs font-semibold text-white transition-colors duration-500 sm:text-sm",
                      isActive
                        ? "bg-oboya-blue-light shadow-[0_0_28px_color-mix(in_srgb,var(--oboya-blue-light)_55%,transparent)]"
                        : "bg-oboya-blue",
                    )}
                  >
                    {title}
                  </h3>
                  <p className="mt-3 line-clamp-3 min-h-[4.65em] text-sm leading-relaxed text-white/85 md:text-[0.9375rem]">
                    {description}
                  </p>
                  <Link
                    href={href}
                    tabIndex={isActive ? 0 : -1}
                    className={cn(
                      "mt-3 inline-flex text-sm font-medium text-white transition-colors hover:text-oboya-green-light",
                      !isActive && "pointer-events-none",
                    )}
                  >
                    {cta} →
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
          className={cn(navBtn, "border-2 border-oboya-blue-dark/60 text-oboya-blue-dark hover:bg-oboya-blue-dark/10")}
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
