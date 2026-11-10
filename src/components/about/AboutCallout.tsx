"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";

interface AboutCalloutProps {
  data: AboutPageSettings["callout"];
  locale: string;
}

/** Navy statement band: green lead line highlighted beside the white body. */
export function AboutCallout({ data, locale }: AboutCalloutProps) {
  const reduceMotion = useReducedMotion();
  const lead = data.segments
    .map((segment) => pickLocalized(segment.text, locale))
    .join("")
    .trim();
  const leadWithPeriod =
    lead && !/[.!?…]$/.test(lead) ? `${lead}.` : lead;
  const body = data.body
    ? pickLocalized(data.body, locale).replace(/\s*\n\s*/g, " ").trim()
    : "";

  if (!leadWithPeriod && !body) return null;

  return (
    <section
      data-about-callout="navy"
      className="bg-oboya-blue-dark"
      aria-labelledby={leadWithPeriod ? "about-callout-heading" : undefined}
    >
      <motion.div
        className="mx-auto grid w-full max-w-[var(--container-max)] gap-6 px-[var(--container-padding)] py-[clamp(4rem,9vw,7rem)] lg:grid-cols-12 lg:gap-12"
        initial={reduceMotion ? false : "hidden"}
        whileInView={reduceMotion ? undefined : "visible"}
        viewport={{ once: true, margin: "-80px" }}
        variants={reduceMotion ? undefined : fadeInUp}
      >
        {leadWithPeriod ? (
          <h2
            id="about-callout-heading"
            className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-[1.2] tracking-[-0.02em] text-oboya-green text-balance lg:col-span-5"
          >
            {leadWithPeriod}
          </h2>
        ) : null}
        {body ? (
          <p
            className={cn(
              "font-display text-[clamp(1.35rem,2.8vw,1.875rem)] font-light leading-[1.4] tracking-[-0.01em] text-white text-pretty lg:col-span-7",
              leadWithPeriod && "lg:col-start-6"
            )}
          >
            {body}
          </p>
        ) : null}
      </motion.div>
    </section>
  );
}
