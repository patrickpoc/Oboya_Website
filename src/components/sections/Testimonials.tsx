"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { fadeInUp, revealViewport } from "@/lib/animations";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";

import { useHorizontalCarousel } from "@/hooks/useHorizontalCarousel";

const GAP_MOBILE = 12;
const GAP_DESKTOP = 16;

function QuoteMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 36"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M18.5 36H0V19.2C0 8.6 6.2 1.4 16.8 0v8.4c-5.1.9-8.1 4.2-8.1 9.3V18H18.5V36Zm29.5 0H29.5V19.2C29.5 8.6 35.7 1.4 46.3 0v8.4c-5.1.9-8.1 4.2-8.1 9.3V18H48V36Z" />
    </svg>
  );
}

function cardsPerView(width: number) {
  if (width < 640) return 1;
  if (width < 1024) return 2;
  return 3;
}

interface TestimonialsProps {
  data: HomepageSettings["testimonials"];
  locale: string;
  animationsEnabled?: boolean;
}

export function Testimonials({
  data,
  locale,
  animationsEnabled = true,
}: TestimonialsProps) {
  const items = data.items;
  const [perPage, setPerPage] = useState(1);
  const [cardWidth, setCardWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [gap, setGap] = useState(GAP_MOBILE);
  const [padLeft, setPadLeft] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const alignRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const count = items.length;
  const isMobileLayout = perPage === 1;
  const step = cardWidth + gap;

  const pageOffsets = useMemo(() => {
    if (count < 1 || step <= 0 || contentWidth <= 0) return [0];

    const trackWidth = cardWidth * count + gap * Math.max(0, count - 1);
    const maxScroll = Math.max(0, trackWidth - contentWidth);
    const pageStep = step * perPage;
    const pageCount = Math.max(1, Math.ceil(count / perPage));

    return Array.from({ length: pageCount }, (_, i) => {
      if (i === pageCount - 1) return maxScroll;
      return Math.min(i * pageStep, maxScroll);
    });
  }, [cardWidth, contentWidth, count, gap, perPage, step]);

  const pageCount = pageOffsets.length;
  const maxScroll = pageOffsets[pageCount - 1] ?? 0;

  const carousel = useHorizontalCarousel({
    viewportRef,
    maxScroll,
    step,
    snapOffsets: pageOffsets,
    animationsEnabled,
    snapOnDragEnd: true,
  });

  const activePage = useMemo(() => {
    if (pageOffsets.length === 0) return 0;
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < pageOffsets.length; i++) {
      const dist = Math.abs(pageOffsets[i] - carousel.scrollOffset);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    return closest;
  }, [carousel.scrollOffset, pageOffsets]);

  const measure = useCallback(() => {
    const align = alignRef.current;
    if (!align) return;

    const nextPerPage = cardsPerView(window.innerWidth);
    const nextGap = window.innerWidth >= 768 ? GAP_DESKTOP : GAP_MOBILE;
    const alignRect = align.getBoundingClientRect();
    const nextContentWidth = alignRect.width;
    const nextPadLeft = Math.max(0, alignRect.left);

    const peek = nextPerPage > 1 ? Math.min(40, nextContentWidth * 0.035) : 0;
    const usable = Math.max(0, nextContentWidth - peek);
    const nextCardWidth =
      (usable - nextGap * Math.max(0, nextPerPage - 1)) / nextPerPage;

    setPerPage(nextPerPage);
    setGap(nextGap);
    setCardWidth(nextCardWidth);
    setContentWidth(nextContentWidth);
    setPadLeft(nextPadLeft);
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
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const inView =
        rect.top < window.innerHeight * 0.7 && rect.bottom > window.innerHeight * 0.3;
      if (!inView) return;
      if (event.key === "ArrowLeft") carousel.go(-1);
      if (event.key === "ArrowRight") carousel.go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [carousel.go]);

  if (count === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="overflow-x-hidden bg-oboya-blue-dark py-[var(--section-y)]"
    >
      <Container>
        <motion.div
          initial={animationsEnabled ? "hidden" : false}
          whileInView={animationsEnabled ? "visible" : undefined}
          viewport={revealViewport}
          variants={fadeInUp}
          className="mb-7 md:mb-9"
        >
          <div className="flex items-center gap-4">
            <p className="shrink-0 text-sm font-medium tracking-wide text-white">
              {pickLocalized(data.eyebrow, locale)}
            </p>
            <div className="h-px flex-1 bg-white/35" aria-hidden />
          </div>
        </motion.div>

        <div ref={alignRef} className="pointer-events-none h-0 w-full" aria-hidden />
      </Container>

      <div
        ref={viewportRef}
        className={cn(
          "overflow-hidden pl-[var(--container-padding)]",
          carousel.viewportClassName
        )}
        style={padLeft > 0 ? { paddingLeft: padLeft } : undefined}
      >
        <motion.div
          className={cn("flex select-none", carousel.trackClassName)}
          style={{ gap, width: "max-content", ...carousel.trackStyle }}
          animate={{ x: carousel.motionX }}
          transition={carousel.transition}
          {...carousel.trackHandlers}
        >
          {items.map((item) => (
            <blockquote
              key={item.id}
              data-testimonial-card
              className={cn(
                "relative flex shrink-0 flex-col items-start bg-oboya-blue p-4 md:p-5",
                isMobileLayout ? "min-h-[18rem] aspect-auto" : "aspect-square"
              )}
              style={{
                width: cardWidth > 0 ? cardWidth : "min(100%, 20rem)",
              }}
            >
              <QuoteMark className="h-6 w-auto self-start text-oboya-blue-light md:h-7" />

              <div className="mt-3 flex min-h-0 w-[80%] flex-1 flex-col gap-2.5">
                <div className="flex min-h-0 flex-1 gap-2.5">
                  <div
                    className="mt-0.5 w-px shrink-0 self-stretch bg-white/25"
                    aria-hidden
                  />
                  <p className="text-base leading-relaxed text-white/90 italic md:text-lg md:leading-relaxed">
                    {pickLocalized(item.quote, locale)}
                  </p>
                </div>
              </div>

              <footer className="mt-auto w-[80%] pt-3">
                <p className="text-xs tracking-[0.08em] text-white/70 uppercase">
                  {pickLocalized(item.author, locale)}
                </p>
                <p className="mt-0.5 text-sm font-bold tracking-[0.06em] text-white uppercase">
                  {pickLocalized(item.role, locale)}
                </p>
              </footer>
            </blockquote>
          ))}
        </motion.div>
      </div>

      <Container>
        <div className="mt-7 flex items-center gap-3 md:mt-9 md:gap-5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => carousel.go(-1)}
              aria-label="Previous testimonials"
              className="flex size-9 items-center justify-center rounded-full border border-white/50 text-white transition-colors hover:border-white hover:bg-white/5"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => carousel.go(1)}
              aria-label="Next testimonials"
              className="flex size-9 items-center justify-center rounded-full border border-white/50 text-white transition-colors hover:border-white hover:bg-white/5"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div
            className="flex h-px flex-1 gap-0"
            role="progressbar"
            aria-valuenow={activePage + 1}
            aria-valuemin={1}
            aria-valuemax={pageCount}
            aria-label="Testimonial page"
          >
            {Array.from({ length: pageCount }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-full flex-1 transition-colors duration-300",
                  i === activePage ? "bg-oboya-green" : "bg-white/15"
                )}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
