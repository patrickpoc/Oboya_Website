"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { easeOutExpo } from "@/lib/animations";
import type { AboutValueItem } from "@/lib/cms/repositories/about-page-repository";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 48;
const EASE = [...easeOutExpo] as [number, number, number, number];
const BANNER_TRANSITION_S = 0.58;
const COLLAPSED_BASIS = "4.25rem";
const AUTOPLAY_MS = 4600;

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

export function ValuesSqueezeCarousel({
  items,
  locale,
}: ValuesSqueezeCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
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

  useEffect(() => {
    if (reduceMotion || paused || count < 2) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, paused, reduceMotion]);

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

  const overlayTransitionClass = reduceMotion
    ? ""
    : "transition-opacity duration-[580ms] ease-[cubic-bezier(0.22,1,0.36,1)]";

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <p className="sr-only" aria-live="polite">
        {pickLocalized(activeItem.title, locale)}
      </p>

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
                flexBasis: isActive ? "0%" : COLLAPSED_BASIS,
              }}
              transition={bannerTransition}
              className={cn(
                "group relative min-w-0 overflow-hidden rounded-2xl text-left [contain:layout_paint] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/60 focus-visible:ring-offset-2",
                isActive ? "cursor-default" : "cursor-pointer"
              )}
              style={{ flexShrink: 0 }}
            >
              <div className="absolute inset-0 overflow-hidden bg-oboya-soft-white">
                <div className="absolute inset-y-0 left-0 h-full w-[max(100%,var(--container-max,80rem))]">
                  <Image
                    src={item.image.src}
                    alt={pickLocalized(item.image.alt, locale)}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 1280px) 80vw, 80rem"
                    className={cn(
                      "object-cover",
                      !isActive &&
                        !reduceMotion &&
                        "transition-transform duration-500 ease-out group-hover:scale-[1.04] [@media(hover:none)]:group-hover:scale-100"
                    )}
                    style={{ objectPosition: item.objectPosition ?? "center" }}
                  />
                </div>
              </div>

              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-t from-oboya-blue-dark/85 via-oboya-blue-dark/25 to-transparent",
                  overlayTransitionClass,
                  isActive
                    ? "opacity-100"
                    : "opacity-40 group-hover:opacity-55"
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
