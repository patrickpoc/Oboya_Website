"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

const SLIDES = [
  "Increasing labor pressures.",
  "Growing quality expectations.",
  "More complex supply chains.",
  "Greater demands for operational efficiency.",
];

const FIXED_TEXT =
  "Oboya Horticulture helps horticultural businesses navigate these realities with practical solutions designed to deliver measurable results.";

const INTERVAL_MS = 2700;

export function HomeChallenges() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        "min-h-[min(63.7vw,23.66rem)] md:min-h-[27.3rem] lg:min-h-[30.94rem]"
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url(/assets/homepage/solutions-integrated.jpg)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/55" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 bg-gradient-to-b from-oboya-soft-white to-transparent" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1 bg-gradient-to-t from-oboya-blue-dark to-transparent" aria-hidden />

      <motion.div
        className="relative z-10 flex min-h-[inherit] flex-col items-center px-[var(--container-padding)] text-center pt-[3rem] pb-[2rem] md:pt-14 md:pb-8"
        initial={reduceMotion ? false : "hidden"}
        whileInView={reduceMotion ? undefined : "visible"}
        viewport={{ once: true, margin: "-80px" }}
        variants={reduceMotion ? undefined : fadeInUp}
      >
        <h2 className="max-w-3xl font-display text-[clamp(2.1rem,3.8vw,3rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-white text-balance">
          Built Around the Challenges Facing<br />Horticulture Today
        </h2>

        <div className="relative h-[3rem] w-full max-w-2xl md:h-[2.5rem] flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center font-body text-[1.225rem] font-light leading-[1.55] text-oboya-soft-white md:text-[1.3125rem] md:leading-[1.5]"
            >
              {SLIDES[index]}
            </motion.p>
          </AnimatePresence>
        </div>

        <p className="mt-auto max-w-xl font-body text-[0.9375rem] font-normal leading-[1.6] text-white/90 md:text-[1rem]">
          {FIXED_TEXT}
        </p>
      </motion.div>
    </section>
  );
}
