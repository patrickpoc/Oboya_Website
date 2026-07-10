"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { fadeInUp } from "@/lib/animations";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";

const PER_PAGE = 3;

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

interface TestimonialsProps {
  data: HomepageSettings["testimonials"];
  locale: string;
}

export function Testimonials({ data, locale }: TestimonialsProps) {
  const items = data.items;
  const [page, setPage] = useState(0);
  const [offsets, setOffsets] = useState<number[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const alignRef = useRef<HTMLDivElement>(null);

  const count = items.length;
  const pageCount = Math.max(1, Math.ceil(count / PER_PAGE));

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const align = alignRef.current;
    if (!viewport || !track || !align) return;

    const cards = Array.from(
      track.querySelectorAll<HTMLElement>("[data-testimonial-card]")
    );
    if (cards.length === 0) return;

    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "16") || 16;
    const padLeft =
      Number.parseFloat(window.getComputedStyle(viewport).paddingLeft) || 0;
    const cardWidth = cards[0].offsetWidth;
    const pageStep = (cardWidth + gap) * PER_PAGE;
    const trackWidth =
      cardWidth * cards.length + gap * Math.max(0, cards.length - 1);

    const viewportRect = viewport.getBoundingClientRect();
    const trackStart = viewportRect.left + padLeft;
    const alignRight = align.getBoundingClientRect().right;
    const visibleWidth = Math.max(0, alignRight - trackStart);
    const maxTranslate = Math.max(0, trackWidth - visibleWidth);

    const nextOffsets = Array.from({ length: pageCount }, (_, i) => {
      if (i === pageCount - 1) return maxTranslate;
      return Math.min(i * pageStep, maxTranslate);
    });

    setOffsets(nextOffsets);
  }, [pageCount]);

  useEffect(() => {
    measure();
    const id = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
    };
  }, [measure, count]);

  const go = useCallback(
    (direction: -1 | 1) => {
      setPage((prev) => (prev + direction + pageCount) % pageCount);
    },
    [pageCount]
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (count === 0) return null;

  const x = offsets[page] ?? 0;

  return (
    <section className="overflow-x-hidden bg-oboya-blue-dark py-12 md:py-16 lg:py-20">
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
        ref={viewportRef}
        className="overflow-hidden pl-[var(--container-padding)] xl:pl-[max(var(--container-padding),calc((100vw-var(--container-max))/2+var(--container-padding)))]"
      >
        <motion.div
          ref={trackRef}
          className="testimonials-track flex gap-3 md:gap-4"
          animate={{ x: -x }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {items.map((item) => (
            <blockquote
              key={item.id}
              data-testimonial-card
              className="relative flex aspect-square w-[75%] shrink-0 flex-col items-start bg-oboya-blue p-4 sm:w-[42%] md:w-[30%] md:p-5 lg:w-[28%]"
            >
              <QuoteMark className="h-6 w-auto self-start text-oboya-blue-light md:h-7" />

              <div className="mt-3 flex min-h-0 w-[80%] flex-[1_1_80%] flex-col gap-2.5">
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
                <p className="text-[11px] tracking-[0.08em] text-white/70 uppercase md:text-xs">
                  {pickLocalized(item.author, locale)}
                </p>
                <p className="mt-0.5 text-xs font-bold tracking-[0.06em] text-white uppercase md:text-sm">
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
