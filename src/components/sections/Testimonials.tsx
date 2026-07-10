"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { fadeInUp } from "@/lib/animations";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 48;

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

function initialPerPage() {
  if (typeof window === "undefined") return 1;
  return cardsPerView(window.innerWidth);
}

interface TestimonialsProps {
  data: HomepageSettings["testimonials"];
  locale: string;
}

export function Testimonials({ data, locale }: TestimonialsProps) {
  const items = data.items;
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [cardWidth, setCardWidth] = useState(0);
  const [padLeft, setPadLeft] = useState(0);
  const [offsets, setOffsets] = useState<number[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const alignRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const pointerStartX = useRef<number | null>(null);
  const pointerDeltaX = useRef(0);

  const count = items.length;
  const pageCount = Math.max(1, Math.ceil(count / perPage));
  const isMobileLayout = perPage === 1;

  const measure = useCallback(() => {
    const track = trackRef.current;
    const align = alignRef.current;
    if (!track || !align) return;

    const nextPerPage = cardsPerView(window.innerWidth);
    const styles = window.getComputedStyle(track);
    const nextGap =
      Number.parseFloat(styles.columnGap || styles.gap || "16") || 16;

    const alignRect = align.getBoundingClientRect();
    const contentWidth = alignRect.width;
    const nextPadLeft = Math.max(0, alignRect.left);

    const peek = nextPerPage > 1 ? Math.min(40, contentWidth * 0.035) : 0;
    const usable = Math.max(0, contentWidth - peek);
    const nextCardWidth =
      (usable - nextGap * Math.max(0, nextPerPage - 1)) / nextPerPage;

    const trackWidth =
      nextCardWidth * count + nextGap * Math.max(0, count - 1);
    const maxTranslate = Math.max(0, trackWidth - contentWidth);
    const pageStep = (nextCardWidth + nextGap) * nextPerPage;
    const nextPageCount = Math.max(1, Math.ceil(count / nextPerPage));

    const nextOffsets = Array.from({ length: nextPageCount }, (_, i) => {
      if (i === nextPageCount - 1) return maxTranslate;
      return Math.min(i * pageStep, maxTranslate);
    });

    setPerPage(nextPerPage);
    setCardWidth(nextCardWidth);
    setPadLeft(nextPadLeft);
    setOffsets(nextOffsets);
    setPage((prev) => Math.min(prev, Math.max(0, nextOffsets.length - 1)));
  }, [count]);

  useEffect(() => {
    measure();
    const id = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const go = useCallback(
    (direction: -1 | 1) => {
      setPage((prev) => (prev + direction + pageCount) % pageCount);
    },
    [pageCount]
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.7 && rect.bottom > window.innerHeight * 0.3;
      if (!inView) return;
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerStartX.current = event.clientX;
    pointerDeltaX.current = 0;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (pointerStartX.current == null) return;
    pointerDeltaX.current = event.clientX - pointerStartX.current;
  };

  const onPointerUp = () => {
    if (pointerStartX.current == null) return;
    const delta = pointerDeltaX.current;
    pointerStartX.current = null;
    pointerDeltaX.current = 0;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    go(delta < 0 ? 1 : -1);
  };

  if (count === 0) return null;

  const x = offsets[page] ?? 0;

  return (
    <section
      ref={sectionRef}
      className="overflow-x-hidden bg-oboya-blue-dark py-12 md:py-16 lg:py-20"
    >
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
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
        className="overflow-hidden pl-[var(--container-padding)]"
        style={padLeft > 0 ? { paddingLeft: padLeft } : undefined}
      >
        <motion.div
          ref={trackRef}
          className="testimonials-track flex touch-pan-y gap-3 md:gap-4"
          animate={{ x: -x }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "max-content" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {items.map((item) => (
            <blockquote
              key={item.id}
              data-testimonial-card
              className={cn(
                "relative flex shrink-0 flex-col items-start bg-oboya-blue p-4 md:p-5",
                isMobileLayout
                  ? "min-h-[18rem] aspect-auto"
                  : "aspect-square"
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
              onClick={() => go(-1)}
              aria-label="Previous testimonials"
              className="flex size-9 items-center justify-center rounded-full border border-white/50 text-white transition-colors hover:border-white hover:bg-white/5"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next testimonials"
              className="flex size-9 items-center justify-center rounded-full border border-white/50 text-white transition-colors hover:border-white hover:bg-white/5"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div
            className="flex h-px flex-1 gap-0"
            role="progressbar"
            aria-valuenow={page + 1}
            aria-valuemin={1}
            aria-valuemax={pageCount}
            aria-label="Testimonial page"
          >
            {Array.from({ length: pageCount }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-full flex-1 transition-colors duration-300",
                  i === page ? "bg-oboya-green" : "bg-white/15"
                )}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
