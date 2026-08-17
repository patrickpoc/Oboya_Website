"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { fadeInUp } from "@/lib/animations";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { pickLocalized } from "@/lib/cms/utils";

const SWIPE_THRESHOLD = 48;
const GAP = 20;

function cardsPerView(width: number) {
  if (width < 640) return 1.15;
  if (width < 1024) return 2.2;
  return 3.15;
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
  const [index, setIndex] = useState(0);
  const [perView, setPerView] = useState(3.15);
  const [cardWidth, setCardWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);
  const pointerDeltaX = useRef(0);

  const count = items.length;

  /** Furthest index that still fills the viewport — no empty trailing space */
  const maxIndex = useMemo(() => {
    if (count <= 0) return 0;
    const fullyVisible = Math.max(1, Math.floor(perView));
    return Math.max(0, count - fullyVisible);
  }, [count, perView]);

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
    setIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  const go = useCallback(
    (direction: -1 | 1) => {
      if (count < 1 || maxIndex < 0) return;
      setIndex((prev) => {
        if (maxIndex === 0) return 0;
        const next = prev + direction;
        if (next > maxIndex) return 0;
        if (next < 0) return maxIndex;
        return next;
      });
    },
    [count, maxIndex]
  );

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

  const x = index * (cardWidth + GAP);

  return (
    <section className="overflow-x-hidden bg-oboya-soft-white py-[var(--section-y)]">
      <Container>
        <motion.div
          initial={animationsEnabled ? "hidden" : false}
          whileInView={animationsEnabled ? "visible" : undefined}
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="mb-8 md:mb-12"
        >
          <div className="mb-5 flex items-center gap-4">
            <p className="shrink-0 text-sm font-semibold tracking-wide text-oboya-blue-dark">
              {pickLocalized(data.eyebrow, locale)}
            </p>
            <div className="h-px flex-1 bg-oboya-blue-dark/25" aria-hidden />
          </div>
          <h2 className="max-w-4xl font-display text-[clamp(1.45rem,2.8vw,2.25rem)] font-bold leading-[1.3] tracking-tight text-oboya-blue-dark text-balance">
            {pickLocalized(data.title, locale)}
          </h2>
        </motion.div>

        <div ref={viewportRef} className="overflow-hidden">
          <motion.div
            className="flex touch-pan-y"
            style={{ gap: GAP, width: "max-content" }}
            animate={{ x: -x }}
            transition={
              animationsEnabled
                ? { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0 }
            }
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {items.map((item) => {
              const title = pickLocalized(item.title, locale);
              const description = pickLocalized(item.description, locale);
              const cta =
                item.ctaLabel != null
                  ? pickLocalized(item.ctaLabel, locale)
                  : "Explore Solutions";
              const href = item.href || "/solutions";

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
