"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import { cn } from "@/lib/utils";

interface AboutCalloutProps {
  data: AboutPageSettings["callout"];
  locale: string;
  /** Same institutional image used by the About hero. */
  imageSrc?: string | null;
}

export function AboutCallout({ data, locale, imageSrc }: AboutCalloutProps) {
  const reduceMotion = useReducedMotion();
  const title = data.segments
    .map((segment) => pickLocalized(segment.text, locale))
    .join("")
    .trim();
  const body = data.body ? pickLocalized(data.body, locale) : "";
  const paragraphs = body
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const backgroundSrc =
    imageSrc || "/assets/about/institutional.png";

  if (!title && paragraphs.length === 0) return null;

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        "min-h-[min(54.6vw,20.8rem)] md:min-h-[23.4rem] lg:min-h-[26rem]"
      )}
      aria-labelledby={title ? "about-callout-heading" : undefined}
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url(${backgroundSrc})`,
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/50" aria-hidden />

      <motion.div
        className="relative z-10 flex min-h-[inherit] flex-col justify-center px-[var(--container-padding)] py-[3.25rem] text-left md:py-[3.9rem] lg:py-[4.55rem]"
        initial={reduceMotion ? false : "hidden"}
        whileInView={reduceMotion ? undefined : "visible"}
        viewport={{ once: true, margin: "-80px" }}
        variants={reduceMotion ? undefined : fadeInUp}
      >
        <div className="mx-auto w-full max-w-[var(--container-max)]">
          {title ? (
            <h2
              id="about-callout-heading"
              className="max-w-4xl font-display text-[clamp(2rem,3.6vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-white text-balance"
            >
              {title}
            </h2>
          ) : null}

          {paragraphs.length > 0 ? (
            <div className="mt-6 max-w-4xl space-y-5 md:mt-8 md:space-y-6">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={`${index}-${paragraph.slice(0, 24)}`}
                  className="whitespace-pre-line font-body text-[clamp(0.95rem,1.5vw,1.125rem)] font-normal leading-[1.55] text-white/92 md:leading-[1.6]"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </motion.div>
    </section>
  );
}
