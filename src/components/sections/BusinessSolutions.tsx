"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { fadeInUp, carouselSnapTransition, revealViewport } from "@/lib/animations";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";
import { isSolutionCategoryId } from "@/lib/solutions/category-stages";

const DRAG_CLICK_THRESHOLD = 8;
const GAP = 20;

/** Route homepage segment cards to their dedicated Solutions category page. */
function resolveBusinessSolutionHref(href: string | undefined, itemId: string) {
  if (isSolutionCategoryId(itemId)) {
    return `/solutions/${itemId}`;
  }
  const raw = (href || "").trim();
  return raw || "/solutions";
}

function cardsPerView(width: number) {
  if (width < 640) return 1.15;
  if (width < 1024) return 2.2;
  return 3.15;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

interface BusinessSolutionsProps {
  data: HomepageSettings["businessSolutions"];
  locale: string;
  animationsEnabled?: boolean;
}

export function BusinessSolutions({
  data,
  locale,
  animationsEnabled = true,
}: BusinessSolutionsProps) {
  const items = data.items;
  const [perView, setPerView] = useState(3.15);
  const [cardWidth, setCardWidth] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [animateSnap, setAnimateSnap] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);
  const pointerDeltaX = useRef(0);
  const suppressClick = useRef(false);

  const count = items.length;

  /** Furthest index that still fills the viewport — no empty trailing space */
  const maxIndex = useMemo(() => {
    if (count <= 0) return 0;
    const fullyVisible = Math.max(1, Math.floor(perView));
    return Math.max(0, count - fullyVisible);
  }, [count, perView]);

  const step = cardWidth + GAP;
  const maxScroll = maxIndex * step;

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const per = cardsPerView(window.innerWidth);
    setPerView(per);
    const w = (viewport.clientWidth - GAP * Math.floor(per)) / per;
    setCardWidth(Math.max(240, w));
  }, []);

  useEffect(() => {
    measure();
    const id = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useEffect(() => {
    setScrollOffset((prev) => clamp(prev, 0, maxScroll));
  }, [maxScroll]);

  const go = useCallback(
    (direction: -1 | 1) => {
      if (count < 1 || step <= 0) return;

      setAnimateSnap(true);
      setScrollOffset((prev) => {
        const currentIndex = Math.round(prev / step);
        let nextIndex = currentIndex + direction;
        if (maxIndex === 0) return 0;
        if (nextIndex > maxIndex) nextIndex = 0;
        if (nextIndex < 0) nextIndex = maxIndex;
        return nextIndex * step;
      });
    },
    [count, maxIndex, step]
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (event: WheelEvent) => {
      let delta = 0;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        delta = event.deltaX;
      } else if (event.shiftKey && event.deltaY !== 0) {
        delta = event.deltaY;
      }
      if (delta === 0) return;

      const rect = viewport.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      event.preventDefault();
      setAnimateSnap(false);
      setScrollOffset((prev) => clamp(prev + delta, 0, maxScroll));
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [maxScroll]);

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as HTMLElement | null)?.closest?.("button")) return;

    setAnimateSnap(false);
    pointerStartX.current = event.clientX;
    pointerDeltaX.current = 0;
    setDragDelta(0);
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (pointerStartX.current == null) return;
    const delta = event.clientX - pointerStartX.current;
    pointerDeltaX.current = delta;
    setDragDelta(delta);
  };

  const finishDrag = () => {
    if (pointerStartX.current == null) return;

    const delta = pointerDeltaX.current;
    pointerStartX.current = null;
    pointerDeltaX.current = 0;
    setIsDragging(false);
    setDragDelta(0);

    if (Math.abs(delta) > DRAG_CLICK_THRESHOLD) {
      suppressClick.current = true;
    }

    setAnimateSnap(false);
    setScrollOffset((prev) => clamp(prev - delta, 0, maxScroll));
  };

  const onClickCapture = (event: React.MouseEvent) => {
    if (!suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
  };

  if (count === 0) return null;

  return (
    <section className="overflow-x-hidden bg-oboya-soft-white py-[var(--section-y)]">
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

        <motion.div
          initial={animationsEnabled ? "hidden" : false}
          whileInView={animationsEnabled ? "visible" : undefined}
          viewport={revealViewport}
          variants={fadeInUp}
        >
          <div
            ref={viewportRef}
            className={cn(
              "overflow-hidden",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
          >
            <motion.div
              className="flex touch-none select-none"
              style={{ gap: GAP, width: "max-content" }}
              animate={{ x: -scrollOffset + dragDelta }}
              transition={
                isDragging || !animateSnap || !animationsEnabled
                  ? { duration: 0 }
                  : carouselSnapTransition
              }
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
              onClickCapture={onClickCapture}
            >
            {items.map((item) => {
              const title = pickLocalized(item.title, locale);
              const description = pickLocalized(item.description, locale);
              const cta =
                item.ctaLabel != null
                  ? pickLocalized(item.ctaLabel, locale)
                  : "Explore Solutions";
              const href = resolveBusinessSolutionHref(item.href, item.id);

              return (
                <article
                  key={item.id}
                  className="relative aspect-[4/5] shrink-0 overflow-hidden rounded-2xl sm:aspect-[3/4]"
                  style={{
                    width: cardWidth > 0 ? cardWidth : "min(85vw, 20rem)",
                  }}
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 85vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-oboya-blue-dark" />
                  )}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10"
                    aria-hidden
                  />
                  <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
                    <h3 className="min-h-[2.6em] font-display text-xl font-bold leading-[1.3] text-white md:min-h-[2.6em] md:text-2xl">
                      {title}
                    </h3>
                    <p className="mt-2 line-clamp-3 min-h-[4.65em] text-sm leading-relaxed text-white/85 md:text-[0.9375rem] md:leading-relaxed">
                      {description}
                    </p>
                    <Link
                      href={href}
                      className="mt-4 inline-flex text-sm font-medium text-white transition-colors hover:text-oboya-green-light"
                    >
                      {cta} →
                    </Link>
                  </div>
                </article>
              );
            })}
            </motion.div>
          </div>
        </motion.div>

        <div className="mt-8 flex justify-end gap-2.5 md:mt-10">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous solutions"
            className="flex size-10 items-center justify-center rounded-full border border-oboya-blue-dark/40 text-oboya-blue-dark transition-colors hover:border-oboya-blue-dark hover:bg-oboya-blue-dark/5"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next solutions"
            className="flex size-10 items-center justify-center rounded-full border border-oboya-blue-dark/40 text-oboya-blue-dark transition-colors hover:border-oboya-blue-dark hover:bg-oboya-blue-dark/5"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </Container>
    </section>
  );
}
