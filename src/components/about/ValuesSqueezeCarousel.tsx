"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import type { AboutValueItem } from "@/lib/cms/repositories/about-page-repository";
import { pickLocalized } from "@/lib/cms/utils";
import {
  SQUEEZE_BANNER_S,
  SQUEEZE_CARD_SURFACE_CLASS,
  SQUEEZE_MEDIA_LAYER_CLASS,
  squeezeCardTransition,
  squeezeCardZIndex,
  squeezeCollapsedPanelOpacity,
  squeezeExpandedPanelOpacity,
  squeezeLayerTransition,
  squeezePanelTransition,
} from "@/lib/squeeze-carousel-motion";
import { cn } from "@/lib/utils";

const BANNER_TRANSITION_S = SQUEEZE_BANNER_S;
const COLLAPSED_BASIS = "2.75rem";
const EXPANDED_BASIS = "18rem";
const AUTOPLAY_MS = 4600;

const VALUE_ACCENTS = [
  "#004F7C",
  "#4DAF4E",
  "#009CD4",
  "#01203F",
  "#ea5744",
  "#75C566",
  "#909B03",
] as const;

const LIGHT_ACCENTS = new Set(
  ["#f1f5f1", "#dbe64c", "#75c566"].map((c) => c.toLowerCase())
);

export interface ValuesSqueezeCarouselProps {
  items: AboutValueItem[];
  locale: string;
}

function isLightAccent(hex: string) {
  return LIGHT_ACCENTS.has(hex.trim().toLowerCase());
}

function anchorMotion(isActive: boolean) {
  return { top: isActive ? "100%" : "50%", y: isActive ? "-100%" : "-50%" };
}

export function ValuesSqueezeCarousel({
  items,
  locale,
}: ValuesSqueezeCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  const count = items.length;
  const activeItem = items[activeIndex] ?? items[0];

  const goTo = useCallback(
    (index: number) => {
      if (count === 0 || index === activeIndex) return;
      setActiveIndex(((index % count) + count) % count);
    },
    [activeIndex, count]
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => {
    if (reduceMotion || paused || count < 2) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, paused, reduceMotion]);

  if (count === 0 || !activeItem) return null;

  const reduce = Boolean(reduceMotion);
  const cardTransition = squeezeCardTransition(reduce);
  const layerTransition = squeezeLayerTransition(reduce);

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

      <LayoutGroup id="values-squeeze">
        <div
          className={cn(
            "flex h-[min(44rem,82svh)] flex-col gap-2 md:h-[min(52rem,68vh)] md:gap-3",
            "focus-within:outline-none"
          )}
          style={{
            minHeight: `calc(${EXPANDED_BASIS} + ${COLLAPSED_BASIS} * ${Math.max(0, count - 1)})`,
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp") {
              event.preventDefault();
              goPrev();
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              goNext();
            }
          }}
        >
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            const title = pickLocalized(item.title, locale);
            const description = pickLocalized(item.description, locale);
            const accent = VALUE_ACCENTS[index % VALUE_ACCENTS.length];
            const onLight = isLightAccent(accent);
            const collapsedInk = onLight ? "text-oboya-blue-dark" : "text-white";

            return (
              <motion.button
                key={item.id}
                type="button"
                aria-label={title}
                aria-expanded={isActive}
                onClick={() => goTo(index)}
                initial={false}
                animate={{
                  flexGrow: isActive ? 1 : 0,
                  flexBasis: isActive ? EXPANDED_BASIS : COLLAPSED_BASIS,
                }}
                transition={cardTransition}
                className={cn(
                  "relative min-h-0 w-full overflow-hidden rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/60 focus-visible:ring-offset-2",
                  SQUEEZE_CARD_SURFACE_CLASS,
                  isActive
                    ? "min-h-[18rem] cursor-default md:min-h-[22rem]"
                    : "cursor-pointer"
                )}
                style={{ flexShrink: 0, zIndex: squeezeCardZIndex(isActive) }}
              >
                <div
                  className={cn(
                    "absolute inset-0 overflow-hidden bg-oboya-soft-white",
                    SQUEEZE_MEDIA_LAYER_CLASS
                  )}
                >
                  <Image
                    src={item.image.src}
                    alt={pickLocalized(item.image.alt, locale)}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover"
                    style={{ objectPosition: item.objectPosition ?? "center" }}
                  />
                </div>

                <motion.div
                  aria-hidden
                  initial={false}
                  animate={{ opacity: isActive ? 0 : 0.92 }}
                  transition={layerTransition}
                  className="absolute inset-0"
                  style={{ backgroundColor: accent }}
                />

                <motion.div
                  aria-hidden
                  initial={false}
                  animate={{ opacity: isActive ? 1 : 0 }}
                  transition={layerTransition}
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-oboya-blue-dark/50 via-transparent to-transparent"
                />

                <motion.div
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-[2]"
                  initial={false}
                  animate={squeezeExpandedPanelOpacity(isActive)}
                  transition={squeezePanelTransition(reduce, isActive)}
                  aria-hidden={!isActive}
                >
                  <div className="w-full bg-gradient-to-t from-oboya-blue-dark/80 via-oboya-blue-dark/40 to-transparent px-4 pb-4 pt-16 md:px-6 md:pb-6 md:pt-20 lg:px-8 lg:pb-8 lg:pt-24">
                    <h3 className="font-display text-lg font-semibold tracking-tight text-white sm:text-xl md:text-2xl">
                      {title}
                    </h3>
                    <p className="overflow-hidden font-body text-sm leading-relaxed text-white/90 md:text-base">
                      {description}
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="pointer-events-none absolute inset-x-0 z-[3]"
                  initial={false}
                  animate={{
                    ...anchorMotion(isActive),
                    ...squeezeCollapsedPanelOpacity(isActive),
                  }}
                  transition={{
                    opacity: squeezePanelTransition(reduce, !isActive),
                    top: layerTransition,
                    y: layerTransition,
                  }}
                  aria-hidden={isActive}
                >
                  <div className="w-full px-4 md:px-5">
                    <h3
                      className={cn(
                        "truncate font-display text-sm font-semibold tracking-tight md:text-base",
                        collapsedInk
                      )}
                    >
                      {title}
                    </h3>
                  </div>
                </motion.div>
              </motion.button>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}
