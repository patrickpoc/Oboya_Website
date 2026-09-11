"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";

interface SolutionsHeroIndexProps {
  variant?: "index";
  headline: string;
  body: string;
}

interface SolutionsHeroCategoryProps {
  variant: "category";
  title: string;
  image: string;
}

export type SolutionsHeroProps =
  | SolutionsHeroIndexProps
  | SolutionsHeroCategoryProps;

/** Half-viewport banner above the catalog (minus fixed navbar). */
const HERO_SECTION_CLASS =
  "relative min-h-[calc((100svh-4rem)/2)] overflow-hidden bg-oboya-blue-dark md:min-h-[calc((100svh-5rem)/2)]";

export function SolutionsHero(props: SolutionsHeroProps) {
  const reduceMotion = useReducedMotion();

  if (props.variant === "category") {
    return (
      <section className={HERO_SECTION_CLASS}>
        <div className="absolute inset-0">
          <Image
            src={props.image}
            alt={props.title}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/35" aria-hidden />
        </div>
        <div className="relative z-10 flex min-h-[inherit] w-full flex-col items-center justify-center px-[var(--container-padding)] py-[clamp(1.5rem,3.5vw,2.25rem)] pt-16 md:pt-20">
          <motion.h1
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "visible"}
            variants={reduceMotion ? undefined : fadeInUp}
            className="w-full max-w-[var(--container-max)] text-left font-display text-[clamp(1.375rem,2.4vw,1.875rem)] font-bold leading-[1.2] tracking-[-0.01em] text-white text-pretty"
          >
            {props.title}
          </motion.h1>
        </div>
      </section>
    );
  }

  return (
    <section className={HERO_SECTION_CLASS}>
      <motion.div
        variants={staggerContainer}
        initial={reduceMotion ? false : "hidden"}
        animate={reduceMotion ? undefined : "visible"}
        className="relative z-10 flex min-h-[inherit] w-full flex-col items-center justify-center px-[var(--container-padding)] py-[clamp(1.5rem,3.5vw,2.25rem)] pt-16 md:pt-20"
      >
        <div className="w-full max-w-[var(--container-max)] text-left">
          <motion.h1
            variants={fadeInUp}
            className="ml-[calc((100%-100vw)/4)] font-display text-[clamp(1.375rem,2.4vw,1.875rem)] font-medium leading-[1.2] tracking-[-0.01em] text-white text-pretty"
          >
            {props.headline}
          </motion.h1>

          <motion.div
            variants={fadeInUp}
            className="mt-3 ml-[calc((100%-100vw)/4)] h-px w-[calc(100%+(100vw-100%)/2)] bg-white md:mt-3.5"
            aria-hidden
          />

          <motion.p
            variants={fadeInUp}
            className="ml-[calc((100%-100vw)/4)] mt-5 w-[calc(100%+(100vw-100%)/2)] font-body text-[clamp(0.875rem,1.15vw,1rem)] font-normal leading-[1.55] text-white md:mt-6 md:leading-[1.6]"
          >
            {props.body}
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
