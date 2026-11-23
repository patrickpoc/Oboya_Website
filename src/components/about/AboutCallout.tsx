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

/** White statement band: green lead line beside the dark-blue body. */
export function AboutCallout({ data, locale }: AboutCalloutProps) {
  const reduceMotion = useReducedMotion();
  const lead = data.segments
    .map((segment) => pickLocalized(segment.text, locale))
    .join("")
    .trim();
  const leadWithPeriod =
    lead && !/[.!?…]$/.test(lead) ? `${lead}.` : lead;
  // A blank line in the CMS text starts a new paragraph; single line breaks are joined.
  const paragraphs = data.body
    ? pickLocalized(data.body, locale)
        .split(/\n\s*\n/)
        .map((part) => part.replace(/\s*\n\s*/g, " ").trim())
        .filter(Boolean)
    : [];

  if (!leadWithPeriod && paragraphs.length === 0) return null;

  return (
    <section
      data-about-callout="white"
      className="border-t border-white bg-white"
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
            // Narrow enough to break as "More Than a / Supplier." (no balancing, which would split after "Than").
            className="max-w-[7em] font-display text-[clamp(1.85rem,3.6vw,3.15rem)] font-light leading-[1.08] tracking-[-0.02em] text-oboya-blue-dark lg:col-span-5"
          >
            {leadWithPeriod}
          </h2>
        ) : null}
        {paragraphs.length ? (
          <div
            className={cn(
              "space-y-4 font-body text-[0.9375rem] leading-[1.6] text-oboya-blue-dark/80 text-pretty lg:col-span-7",
              leadWithPeriod && "lg:col-start-6"
            )}
          >
            {paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        ) : null}
      </motion.div>
    </section>
  );
}
