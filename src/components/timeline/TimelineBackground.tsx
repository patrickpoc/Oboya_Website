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

/** Full-bleed year image; slides RTL on advance, LTR on back. */
export function TimelineBackground({
  events,
  activeIndex,
  direction,
}: TimelineBackgroundProps) {
  const event = events[activeIndex];
  if (!event) return null;

  const enterX = direction === "forward" ? "100%" : "-100%";
  const exitX = direction === "forward" ? "-100%" : "100%";

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-oboya-blue-dark" />

      <AnimatePresence initial={false} custom={direction} mode="sync">
        <motion.div
          key={event.id}
          className="absolute inset-0"
          custom={direction}
          initial={{ x: enterX, opacity: 0.85 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: exitX, opacity: 0.85 }}
          transition={{ duration: 0.75, ease }}
        >
          <Image
            src={event.image}
            alt=""
            fill
            priority
            className="object-cover scale-105"
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-oboya-blue-dark/78" />
      <div className="absolute inset-0 bg-gradient-to-b from-oboya-blue-dark/35 via-oboya-blue-dark/55 to-oboya-blue-dark/92" />
    </div>
  );
}
