"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { TimelineEvent } from "@/types/timeline";

export type SlideDirection = "forward" | "back";

interface TimelineBackgroundProps {
  events: TimelineEvent[];
  activeIndex: number;
  direction: SlideDirection;
}

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Full-bleed hero banner — fills ~3/4 of the main column height.
 */
export function TimelineBackground({
  events,
  activeIndex,
  direction,
}: TimelineBackgroundProps) {
  const event = events[activeIndex];
  if (!event) return null;

  const yIn = direction === "forward" ? "100%" : "-100%";
  const yOut = direction === "forward" ? "-100%" : "100%";

  return (
    <div className="relative min-h-0 w-full flex-[3] overflow-hidden bg-transparent">
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={event.id}
          className="absolute inset-0 will-change-transform"
          initial={{ y: yIn, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            transition: {
              y: { duration: 0.55, ease },
              opacity: { duration: 0.4, ease, delay: 0.06 },
            },
          }}
          exit={{
            y: yOut,
            opacity: 0,
            transition: {
              y: { duration: 0.5, ease },
              opacity: { duration: 0.32, ease },
            },
          }}
        >
          <Image
            src={event.image}
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 92vw"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
