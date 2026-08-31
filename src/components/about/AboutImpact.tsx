"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { NumbersSqueezeCarousel } from "@/components/about/NumbersSqueezeCarousel";
import { fadeInUp } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import { cn } from "@/lib/utils";

interface AboutImpactProps {
  data: AboutPageSettings["impact"];
  locale: string;
}

export function AboutImpact({ data, locale }: AboutImpactProps) {
  const reduceMotion = useReducedMotion();
  const title = pickLocalized(data.title, locale);
  const description = pickLocalized(data.description, locale);
  const eyebrow = data.eyebrow
    ? pickLocalized(data.eyebrow, locale)
    : null;

  const reveal = reduceMotion
    ? undefined
    : ({
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, margin: "-80px" },
      } as const);

  return (
    <section className="border-t border-oboya-green/35 bg-white py-[clamp(4.5rem,10vw,8rem)]">
      <Container>
        <motion.div
          {...(reveal ?? {})}
          initial={reveal ? "hidden" : false}
          variants={reduceMotion ? undefined : fadeInUp}
          className="mx-auto mb-10 max-w-3xl text-center md:mb-12"
        >
          {eyebrow ? (
            <p className="font-body text-[0.8125rem] font-medium tracking-[0.04em] text-oboya-green md:text-sm">
              {eyebrow}
            </p>
          ) : null}
          <h2
            className={cn(
              "font-display text-[clamp(1.75rem,3.2vw,2.75rem)] font-semibold tracking-[-0.02em] text-oboya-blue-dark text-balance",
              eyebrow && "mt-4"
            )}
          >
            {title}
          </h2>
        </motion.div>

        <motion.div
          {...(reveal ?? {})}
          initial={reveal ? "hidden" : false}
          variants={reduceMotion ? undefined : fadeInUp}
        >
          <NumbersSqueezeCarousel stats={data.stats} locale={locale} />
        </motion.div>

        <motion.p
          {...(reveal ?? {})}
          initial={reveal ? "hidden" : false}
          variants={reduceMotion ? undefined : fadeInUp}
          className="mx-auto mt-10 max-w-3xl text-center font-body text-[0.9375rem] leading-relaxed text-oboya-blue-dark/65 md:mt-12 md:text-base"
        >
          {description}
        </motion.p>
      </Container>
    </section>
  );
}
