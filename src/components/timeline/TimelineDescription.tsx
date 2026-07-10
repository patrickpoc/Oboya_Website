"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { TimelineEvent } from "@/types/timeline";

interface TimelineDescriptionProps {
  event: TimelineEvent;
  labels: {
    year: string;
  };
}

const ease = [0.22, 1, 0.36, 1] as const;

const item = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease },
  }),
  exit: { opacity: 0, y: -6, transition: { duration: 0.18 } },
};

/** Year + title + subtitle — compact for the half-size bowl. */
export function TimelineDescription({ event, labels }: TimelineDescriptionProps) {
  return (
    <div
      className="relative mx-auto flex w-full max-w-md flex-col items-center px-3 text-center"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={event.id}
          initial="hidden"
          animate="show"
          exit="exit"
          className="flex w-full flex-col items-center"
        >
          <motion.p
            custom={0}
            variants={item}
            className="text-xs font-semibold tracking-[0.18em] md:text-sm"
            style={{ color: event.color ?? "var(--oboya-green)" }}
          >
            <span className="sr-only">{labels.year} </span>
            {event.year}
          </motion.p>

          <motion.h2
            custom={1}
            variants={item}
            className="mt-2.5 max-w-lg font-display font-semibold tracking-tight text-white text-balance"
            style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.35rem)", lineHeight: 1.15 }}
          >
            {event.title}
          </motion.h2>

          <motion.p
            custom={2}
            variants={item}
            className="mt-2 text-xs font-medium text-white/50 md:text-sm"
          >
            {event.subtitle}
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
