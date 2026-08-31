"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { fadeInUp } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";

interface AboutCalloutProps {
  data: AboutPageSettings["callout"];
  locale: string;
}

export function AboutCallout({ data, locale }: AboutCalloutProps) {
  const eyebrow = data.segments
    .map((segment) => pickLocalized(segment.text, locale))
    .join("");
  const body = data.body ? pickLocalized(data.body, locale) : "";

  return (
    <section className="bg-oboya-blue-dark pt-[clamp(2.25rem,5vw,3.75rem)] pb-[clamp(2rem,4.5vw,3.25rem)]">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={fadeInUp}
        >
          <p className="font-body text-sm font-semibold leading-relaxed text-white/85 md:text-[0.9375rem]">
            {data.segments.map((segment, index) => {
              const text = pickLocalized(segment.text, locale);
              const className =
                segment.tone === "green" ? "text-oboya-green" : "text-white/85";
              return (
                <span key={`${text}-${index}`} className={className}>
                  {segment.breakBefore ? <br /> : null}
                  {text}
                </span>
              );
            })}
          </p>
          <div className="mt-3 h-px w-full bg-white/25 md:mt-4" aria-hidden />
          {body ? (
            <h2 className="mt-4 max-w-2xl whitespace-pre-line font-display text-[clamp(1.125rem,2vw,1.625rem)] font-light leading-[1.35] tracking-[-0.02em] text-white text-pretty md:mt-5 lg:max-w-[52%]">
              {body}
            </h2>
          ) : eyebrow ? (
            <h2 className="mt-4 max-w-2xl font-display text-[clamp(1.125rem,2vw,1.625rem)] font-light leading-[1.35] tracking-[-0.02em] text-white text-pretty md:mt-5 lg:max-w-[52%]">
              {eyebrow}
            </h2>
          ) : null}
        </motion.div>
      </Container>
    </section>
  );
}
