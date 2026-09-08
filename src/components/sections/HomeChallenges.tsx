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
        "min-h-[min(72vw,20rem)] sm:min-h-[22rem] md:min-h-[27.3rem] lg:min-h-[30.94rem]"
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url(/assets/homepage/solutions-integrated.jpg)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/55" aria-hidden />

      <motion.div
        className="relative z-10 flex min-h-[inherit] flex-col items-center justify-center gap-5 px-[var(--container-padding)] py-10 text-center sm:gap-6 sm:py-12 md:gap-7 md:py-14"
        initial={reduceMotion ? false : "hidden"}
        whileInView={reduceMotion ? undefined : "visible"}
        viewport={{ once: true, margin: "-80px" }}
        variants={reduceMotion ? undefined : fadeInUp}
      >
        <h2 className="max-w-3xl font-display text-[clamp(1.5rem,5.2vw,3rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-white text-balance">
          Built Around the Challenges Facing Horticulture Today
        </h2>

        <div className="relative flex min-h-[2.75rem] w-full max-w-2xl items-center justify-center sm:min-h-[3rem] md:min-h-[2.5rem]">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center px-1 font-body text-[clamp(0.95rem,3.4vw,1.3125rem)] font-light leading-[1.45] text-oboya-soft-white"
            >
              {SLIDES[index]}
            </motion.p>
          </AnimatePresence>
        </div>

        <p className="max-w-xl font-body text-[clamp(0.875rem,2.6vw,1rem)] font-normal leading-[1.6] text-white/90 text-pretty">
          {FIXED_TEXT}
        </p>
      </motion.div>
    </section>
  );
}
