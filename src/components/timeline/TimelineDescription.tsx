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
            className="text-[0.6875rem] font-semibold tracking-[0.2em] uppercase md:text-xs"
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
            className="mt-2 font-display font-semibold tracking-tight text-white text-balance"
            style={{
              fontSize: "clamp(1.25rem, 2.4vw, 1.75rem)",
              lineHeight: 1.2,
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
            className="mt-2 max-w-xl text-sm font-medium text-white/55 md:text-[0.9375rem]"
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
              className="mt-3 max-w-xl font-body text-sm leading-relaxed text-white/70 md:text-[0.9375rem] md:leading-[1.65]"
            >
              {event.description}
            </motion.p>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
