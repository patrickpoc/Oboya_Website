"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { easeOutExpo } from "@/lib/animations";
import type { AboutValueItem } from "@/lib/cms/repositories/about-page-repository";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 48;
const EASE = [...easeOutExpo] as [number, number, number, number];
/** Matches banner expand duration so copy fades in with the image. */
const BANNER_TRANSITION_S = 0.5;

export interface ValuesSqueezeCarouselProps {
  items: AboutValueItem[];
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

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-9 items-center justify-center rounded-lg border border-oboya-blue-dark/15 bg-white text-oboya-blue-dark shadow-[var(--shadow-subtle)] transition-colors hover:border-oboya-green/40 hover:text-oboya-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/50"
    >
      {children}
    </button>
  );
}

export function ValuesSqueezeCarousel({
  items,
  locale,
}: ValuesSqueezeCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const isDesktop = useIsDesktopSqueeze();
  const pointerStartX = useRef<number | null>(null);
  const pointerDeltaX = useRef(0);
  const mobileTrackRef = useRef<HTMLDivElement>(null);

  const count = items.length;
  const activeItem = items[activeIndex] ?? items[0];

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

  if (count === 0 || !activeItem) return null;

  const bannerTransition = reduceMotion
    ? { duration: 0 }
    : { duration: BANNER_TRANSITION_S, ease: EASE };

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-end gap-2 md:mb-5">
        <NavButton label="Previous value" onClick={goPrev}>
          <ChevronLeft className="size-4" aria-hidden />
        </NavButton>
        <NavButton label="Next value" onClick={goNext}>
          <ChevronRight className="size-4" aria-hidden />
        </NavButton>
      </div>

      <p className="sr-only" aria-live="polite">
        {pickLocalized(activeItem.title, locale)}
      </p>

      {/* Desktop / tablet squeeze */}
      <div
        className={cn(
          "hidden md:flex md:h-[min(28rem,55vh)] md:min-h-[22rem] md:gap-2.5 lg:gap-3",
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
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          const title = pickLocalized(item.title, locale);
          const description = pickLocalized(item.description, locale);

          return (
            <motion.button
              key={item.id}
              type="button"
              aria-label={title}
              aria-pressed={isActive}
              onClick={() => goTo(index)}
              initial={false}
              animate={{
                flexGrow: isActive ? 1 : 0,
                flexBasis: isActive ? "0%" : "4.25rem",
              }}
              transition={bannerTransition}
              className={cn(
                "group relative min-w-0 overflow-hidden rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/60 focus-visible:ring-offset-2",
                isActive ? "cursor-default" : "cursor-pointer"
              )}
              style={{ flexShrink: 0 }}
            >
              <div className="absolute inset-0 bg-oboya-soft-white">
                <Image
                  src={item.image.src}
                  alt={pickLocalized(item.image.alt, locale)}
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
                  style={{ objectPosition: item.objectPosition ?? "center" }}
                />
              </div>

              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-t from-oboya-blue-dark/85 via-oboya-blue-dark/25 to-transparent transition-opacity duration-300",
                  isActive ? "opacity-100" : "opacity-40 group-hover:opacity-55"
                )}
              />

              {/*
                Fixed copy width (not 100% of the panel) so the text layout
                never reflows while the banner flex-grows — only opacity fades
                in sync with the expand animation.
              */}
              <motion.div
                aria-hidden={!isActive}
                initial={false}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={bannerTransition}
                className="pointer-events-none absolute bottom-0 left-0 z-[1] p-6 md:p-7 lg:p-8"
                style={{ width: "min(32rem, 52vw)" }}
              >
                <h3 className="font-display text-[clamp(1.35rem,2.2vw,1.85rem)] font-semibold tracking-tight text-white">
                  {title}
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-white/85 md:text-[0.9375rem]">
                  {description}
                </p>
              </motion.div>
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
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          const title = pickLocalized(item.title, locale);
          const description = pickLocalized(item.description, locale);

          return (
            <button
              key={item.id}
              type="button"
              aria-label={title}
              aria-pressed={isActive}
              onClick={() => goTo(index)}
              className={cn(
                "relative aspect-[4/5] w-[88%] shrink-0 snap-center overflow-hidden rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/60 focus-visible:ring-offset-2",
                !isActive && "opacity-90"
              )}
            >
              <Image
                src={item.image.src}
                alt={pickLocalized(item.image.alt, locale)}
                fill
                priority={index === 0}
                sizes="92vw"
                className="object-cover"
                style={{ objectPosition: item.objectPosition ?? "center" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-oboya-blue-dark/90 via-oboya-blue-dark/35 to-transparent" />
              <motion.div
                aria-hidden={!isActive}
                initial={false}
                animate={{ opacity: isActive ? 1 : 0.85 }}
                transition={bannerTransition}
                className="absolute inset-x-0 bottom-0 p-5"
              >
                <h3 className="font-display text-xl font-semibold tracking-tight text-white">
                  {title}
                </h3>
                <motion.p
                  initial={false}
                  animate={{ opacity: isActive ? 1 : 0 }}
                  transition={bannerTransition}
                  className="mt-2 font-body text-sm leading-relaxed text-white/85"
                >
                  {description}
                </motion.p>
              </motion.div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
