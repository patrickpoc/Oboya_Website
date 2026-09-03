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
      className="relative w-full min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)]"
      aria-labelledby="about-hero-heading"
    >
      <motion.div
        className="relative z-10 flex h-full min-h-[inherit] flex-col justify-center px-[var(--container-padding)] py-10 md:py-12 lg:py-14"
        initial={reduceMotion ? false : "hidden"}
        animate={reduceMotion ? undefined : "visible"}
        variants={reduceMotion ? undefined : fadeInUp}
      >
        <div className="mx-auto w-full max-w-[var(--container-max)]">
          <h1
            id="about-hero-heading"
            className="max-w-4xl font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.1] tracking-[-0.02em] text-white text-balance"
          >
            {title}
          </h1>
          {body ? (
            <p className="mt-5 max-w-3xl font-body text-[clamp(0.95rem,1.5vw,1.125rem)] font-normal leading-[1.55] text-white/92 md:mt-6 md:leading-[1.6] lg:max-w-[58%]">
              {body}
            </p>
          ) : null}
        </div>
      </motion.div>
    </section>
  );
}
