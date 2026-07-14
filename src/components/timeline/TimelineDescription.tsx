"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { TimelineEvent } from "@/types/timeline";

interface TimelineDescriptionProps {
  event: TimelineEvent;
  labels: { year: string };
  direction?: "forward" | "back";
}

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Centered copy under the hero banner.
 * Forward: from top → down. Back: from bottom → up (inverse cascade).
 */
export function TimelineDescription({
  event,
  labels,
  direction = "forward",
}: TimelineDescriptionProps) {
  const enterY = direction === "forward" ? -40 : 40;
  const exitY = direction === "forward" ? 32 : -32;

  const enterDelays =
    direction === "forward"
      ? [0.04, 0.1, 0.16, 0.22]
      : [0.22, 0.16, 0.1, 0.04];
  const exitDelays =
    direction === "forward"
      ? [0, 0.04, 0.08, 0.12]
      : [0.12, 0.08, 0.04, 0];

  return (
    <div
      className="relative mx-auto w-full max-w-3xl overflow-hidden px-1 text-center"
      aria-live="polite"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={event.id}
          className="flex w-full flex-col items-center"
          initial="hidden"
          animate="show"
          exit="exit"
        >
          <motion.p
            variants={{
              hidden: { opacity: 0, y: enterY },
              show: {
                opacity: 1,
                y: 0,
                transition: {
                  y: { duration: 0.48, ease, delay: enterDelays[0] },
                  opacity: { duration: 0.4, ease, delay: enterDelays[0] },
                },
              },
              exit: {
                opacity: 0,
                y: exitY,
                transition: {
                  y: { duration: 0.28, ease, delay: exitDelays[0] },
                  opacity: { duration: 0.22, ease, delay: exitDelays[0] },
                },
              },
            }}
            className="text-xs font-semibold tracking-[0.22em] uppercase md:text-sm"
            style={{ color: event.color ?? "var(--oboya-green)" }}
          >
            <span className="sr-only">{labels.year} </span>
            {event.year}
          </motion.p>

          <motion.h2
            variants={{
              hidden: { opacity: 0, y: enterY },
              show: {
                opacity: 1,
                y: 0,
                transition: {
                  y: { duration: 0.52, ease, delay: enterDelays[1] },
                  opacity: { duration: 0.42, ease, delay: enterDelays[1] },
                },
              },
              exit: {
                opacity: 0,
                y: exitY,
                transition: {
                  y: { duration: 0.28, ease, delay: exitDelays[1] },
                  opacity: { duration: 0.22, ease, delay: exitDelays[1] },
                },
              },
            }}
            className="mt-3 font-display font-semibold tracking-tight text-white text-balance"
            style={{
              fontSize: "clamp(1.85rem, 4vw, 3rem)",
              lineHeight: 1.15,
            }}
          >
            {event.title}
          </motion.h2>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: enterY },
              show: {
                opacity: 1,
                y: 0,
                transition: {
                  y: { duration: 0.48, ease, delay: enterDelays[2] },
                  opacity: { duration: 0.4, ease, delay: enterDelays[2] },
                },
              },
              exit: {
                opacity: 0,
                y: exitY,
                transition: {
                  y: { duration: 0.26, ease, delay: exitDelays[2] },
                  opacity: { duration: 0.2, ease, delay: exitDelays[2] },
                },
              },
            }}
            className="mt-3 max-w-2xl text-base font-medium text-white/60 md:text-lg"
          >
            {event.subtitle}
          </motion.p>

          {event.description ? (
            <motion.p
              variants={{
                hidden: { opacity: 0, y: enterY },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    y: { duration: 0.5, ease, delay: enterDelays[3] },
                    opacity: { duration: 0.42, ease, delay: enterDelays[3] },
                  },
                },
                exit: {
                  opacity: 0,
                  y: exitY,
                  transition: {
                    y: { duration: 0.26, ease, delay: exitDelays[3] },
                    opacity: { duration: 0.2, ease, delay: exitDelays[3] },
                  },
                },
              }}
              className="mt-5 max-w-2xl font-body text-[1.0625rem] leading-[1.75] text-white/75 md:text-lg md:leading-[1.7]"
            >
              {event.description}
            </motion.p>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
