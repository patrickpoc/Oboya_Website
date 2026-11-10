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
      className="relative w-full bg-white pt-[clamp(3.5rem,8vw,6.5rem)] pb-[clamp(2rem,4vw,3rem)]"
      aria-labelledby="about-hero-heading"
    >
      <motion.div
        className="relative z-10 mx-auto grid w-full max-w-[var(--container-max)] gap-6 px-[var(--container-padding)] lg:grid-cols-12 lg:gap-12"
        initial={reduceMotion ? false : "hidden"}
        animate={reduceMotion ? undefined : "visible"}
        variants={reduceMotion ? undefined : fadeInUp}
      >
        <h1
          id="about-hero-heading"
          className="font-display text-[clamp(2.25rem,5vw,3.75rem)] font-light leading-[1.05] tracking-[-0.02em] text-oboya-blue-dark text-balance lg:col-span-5"
        >
          {title}
        </h1>
        {body ? (
          <p className="font-display text-[clamp(1.35rem,2.8vw,1.875rem)] font-light leading-[1.35] tracking-[-0.02em] text-oboya-blue-dark text-pretty lg:col-span-7 lg:pt-2">
            {body}
          </p>
        ) : null}
      </motion.div>
    </section>
  );
}
