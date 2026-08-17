"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { fadeInUp } from "@/lib/animations";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { pickLocalized } from "@/lib/cms/utils";

interface CapabilitiesProps {
  data: HomepageSettings["capabilities"];
  locale: string;
  animationsEnabled?: boolean;
}

export function Capabilities({
  data,
  locale,
  animationsEnabled = true,
}: CapabilitiesProps) {
  const items = data.items;
  const [index, setIndex] = useState(0);
  const count = items.length;
  const slide = items[index];

  const go = useCallback(
    (dir: -1 | 1) => {
      if (count < 1) return;
      setIndex((prev) => (prev + dir + count) % count);
    },
    [count]
  );

  if (!slide) return null;

  const title = pickLocalized(slide.title, locale);
  const description = pickLocalized(slide.description, locale);

  return (
    <section className="bg-oboya-soft-white py-[var(--section-y)]">
      <Container>
        <motion.div
          initial={animationsEnabled ? "hidden" : false}
          whileInView={animationsEnabled ? "visible" : undefined}
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="mb-8 md:mb-10"
        >
          <div className="mb-5 flex items-center gap-4">
            <p className="shrink-0 text-sm font-semibold tracking-wide text-oboya-blue-dark">
              {pickLocalized(data.eyebrow, locale)}
            </p>
            <div className="h-px flex-1 bg-oboya-blue-dark/25" aria-hidden />
          </div>
        </motion.div>

        <div className="relative overflow-hidden rounded-2xl">
          <div className="relative aspect-[16/10] min-h-[20rem] w-full sm:aspect-[21/9] sm:min-h-[24rem]">
            {/* Crossfade: all slides stacked — outgoing image stays until new is opaque */}
            {items.map((item, i) => {
              const active = i === index;
              return (
                <motion.div
                  key={item.id}
                  className="absolute inset-0"
                  initial={false}
                  animate={{ opacity: active ? 1 : 0 }}
                  transition={
                    animationsEnabled
                      ? { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
                      : { duration: 0 }
                  }
                  style={{ zIndex: active ? 1 : 0 }}
                  aria-hidden={!active}
                >
                  <Image
                    src={item.image}
                    alt={pickLocalized(item.title, locale)}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority={i === 0}
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/25 to-black/45"
                    aria-hidden
                  />
                </motion.div>
              );
            })}

            {/* Title — top left */}
            <div className="absolute top-0 left-0 z-10 max-w-[min(100%,28rem)] p-6 sm:p-8 md:max-w-lg md:p-10 lg:p-12">
              <AnimatePresence mode="wait">
                <motion.h2
                  key={`${slide.id}-title`}
                  initial={animationsEnabled ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={animationsEnabled ? { opacity: 0, y: -6 } : undefined}
                  transition={{ duration: 0.35 }}
                  className="font-display text-[clamp(1.65rem,3.8vw,2.85rem)] font-bold leading-tight tracking-tight text-white text-balance"
                >
                  {title}
                </motion.h2>
              </AnimatePresence>
            </div>

            {/* Description — bottom / mid-right */}
            <div className="absolute right-0 bottom-16 z-10 max-w-[min(100%,26rem)] p-6 text-right sm:bottom-20 sm:p-8 md:bottom-24 md:max-w-md md:p-10 lg:bottom-28 lg:p-12">
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${slide.id}-desc`}
                  initial={animationsEnabled ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={animationsEnabled ? { opacity: 0, y: -6 } : undefined}
                  transition={{ duration: 0.35, delay: 0.04 }}
                  className="font-body text-sm leading-relaxed text-white/90 sm:text-base md:text-[1.0625rem] md:leading-[1.65]"
                >
                  {description}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Prev outline / Next solid — bottom right */}
            <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2.5 sm:right-6 sm:bottom-6 md:right-8 md:bottom-8">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous slide"
                className="flex size-10 items-center justify-center rounded-full border border-white/70 bg-transparent text-white transition-colors hover:bg-white/10 sm:size-11"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next slide"
                className="flex size-10 items-center justify-center rounded-full bg-white text-oboya-blue-dark transition-colors hover:bg-white/90 sm:size-11"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
