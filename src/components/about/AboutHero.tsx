"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";

interface AboutHeroProps {
  data: AboutPageSettings["hero"];
  locale: string;
}

export function AboutHero({ data, locale }: AboutHeroProps) {
  const reduceMotion = useReducedMotion();
  const title = pickLocalized(data.title, locale);
  const body = data.body
    ? pickLocalized(data.body, locale)
    : pickLocalized(data.title, locale);

  return (
    <section
      className="relative w-full bg-white py-[clamp(3.5rem,8vw,6.5rem)]"
      aria-labelledby="about-hero-heading"
    >
      <motion.div
        className="relative z-10 mx-auto flex w-full max-w-[var(--container-max)] flex-col items-center px-[var(--container-padding)] text-center"
        initial={reduceMotion ? false : "hidden"}
        animate={reduceMotion ? undefined : "visible"}
        variants={reduceMotion ? undefined : fadeInUp}
      >
        <h1
          id="about-hero-heading"
          className="max-w-3xl font-display text-[clamp(0.95rem,1.6vw,1.125rem)] font-bold leading-snug tracking-[-0.01em] text-oboya-blue-dark text-balance"
        >
          {title}
        </h1>
        {body ? (
          <p className="mt-5 max-w-5xl font-display text-[clamp(1.35rem,3.2vw,2.35rem)] font-light leading-[1.35] tracking-[-0.02em] text-oboya-blue-dark text-balance md:mt-7">
            {body}
          </p>
        ) : null}
      </motion.div>
    </section>
  );
}
