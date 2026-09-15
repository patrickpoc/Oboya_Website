"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import {
  PAGE_INTRO_HERO_SECTION_CLASS,
  PAGE_INTRO_OFFSET_X,
  PAGE_INTRO_STRETCH_W,
} from "@/components/ui/PageIntroBanner";
import { cn } from "@/lib/utils";

/** Same horizontal padding as PageIntroBanner (inlined for Tailwind + HMR). */
const INNER_CLASS =
  "relative z-10 flex min-h-[inherit] w-full flex-col items-center justify-center px-[clamp(2.75rem,11vw,6.5rem)] py-[clamp(1.5rem,3.5vw,2.25rem)] pt-16 md:pt-20";

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

export function SolutionsHero(props: SolutionsHeroProps) {
  const reduceMotion = useReducedMotion();

  if (props.variant === "category") {
    return (
      <section className={PAGE_INTRO_HERO_SECTION_CLASS}>
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
        <div className={INNER_CLASS}>
          <div className="w-full max-w-[var(--container-max)] text-left">
            <motion.h1
              initial={reduceMotion ? false : "hidden"}
              animate={reduceMotion ? undefined : "visible"}
              variants={reduceMotion ? undefined : fadeInUp}
              className={cn(
                PAGE_INTRO_OFFSET_X,
                "font-display text-[clamp(1.375rem,2.4vw,1.875rem)] font-bold leading-[1.2] tracking-[-0.01em] text-white text-pretty"
              )}
            >
              {props.title}
            </motion.h1>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={PAGE_INTRO_HERO_SECTION_CLASS}>
      <motion.div
        variants={staggerContainer}
        initial={reduceMotion ? false : "hidden"}
        animate={reduceMotion ? undefined : "visible"}
        className={INNER_CLASS}
      >
        <div className="w-full max-w-[var(--container-max)] text-left">
          <motion.h1
            variants={fadeInUp}
            className={cn(
              PAGE_INTRO_OFFSET_X,
              "font-display text-[clamp(1.375rem,2.4vw,1.875rem)] font-medium leading-[1.2] tracking-[-0.01em] text-white text-pretty"
            )}
          >
            {props.headline}
          </motion.h1>

          <motion.div
            variants={fadeInUp}
            className={cn(
              PAGE_INTRO_OFFSET_X,
              PAGE_INTRO_STRETCH_W,
              "mt-3 h-px bg-white md:mt-3.5"
            )}
            aria-hidden
          />

          <motion.p
            variants={fadeInUp}
            className={cn(
              PAGE_INTRO_OFFSET_X,
              PAGE_INTRO_STRETCH_W,
              "mt-5 font-body text-[clamp(0.875rem,1.15vw,1rem)] font-normal leading-[1.55] text-white md:mt-6 md:leading-[1.6]"
            )}
          >
            {props.body}
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
