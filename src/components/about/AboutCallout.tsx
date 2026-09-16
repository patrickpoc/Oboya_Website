"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";

interface AboutCalloutProps {
  data: AboutPageSettings["callout"];
  locale: string;
}

/**
 * Solid navy statement band — green lead-in + white body in one paragraph.
 * No background image / parallax.
 */
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
        className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-padding)] py-[clamp(3.75rem,9vw,6.5rem)]"
        initial={reduceMotion ? false : "hidden"}
        whileInView={reduceMotion ? undefined : "visible"}
        viewport={{ once: true, margin: "-80px" }}
        variants={reduceMotion ? undefined : fadeInUp}
      >
        <p
          id="about-callout-heading"
          className="max-w-[52rem] font-display text-[clamp(1.35rem,2.8vw,1.875rem)] font-light leading-[1.4] tracking-[-0.01em] text-pretty"
        >
          {leadWithPeriod ? (
            <span className="text-oboya-green">{leadWithPeriod}</span>
          ) : null}
          {leadWithPeriod && body ? " " : null}
          {body ? <span className="text-white">{body}</span> : null}
        </p>
      </motion.div>
    </section>
  );
}
