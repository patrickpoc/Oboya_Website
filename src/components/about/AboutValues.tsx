"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";

interface AboutValuesProps {
  data: AboutPageSettings["values"];
  locale: string;
}

export function AboutValues({ data, locale }: AboutValuesProps) {
  const reduceMotion = useReducedMotion();
  const title = pickLocalized(data.title, locale);

  return (
    <section className="border-t border-oboya-green/35 bg-white py-[clamp(4.5rem,10vw,8rem)]">
      <Container>
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "visible"}
          viewport={{ once: true, margin: "-80px" }}
          variants={reduceMotion ? undefined : staggerContainer}
        >
          <motion.h2
            variants={reduceMotion ? undefined : fadeInUp}
            className="mb-10 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-light tracking-[-0.02em] text-oboya-blue-dark md:mb-14"
          >
            {title}
          </motion.h2>

          <ul className="grid list-none gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {data.items.map((item) => (
              <motion.li
                key={item.id}
                variants={reduceMotion ? undefined : fadeInUp}
                className="flex min-w-0 flex-col rounded-md border border-oboya-blue-dark/10 bg-oboya-soft-white p-6 md:p-8"
              >
                <h3 className="font-display text-[clamp(1.1rem,1.7vw,1.35rem)] font-semibold leading-snug tracking-[-0.015em] text-oboya-blue-dark text-balance">
                  {pickLocalized(item.title, locale)}
                </h3>
                <p className="mt-3 whitespace-pre-line font-body text-[0.9375rem] leading-[1.65] text-oboya-blue-dark/70 md:text-base">
                  {pickLocalized(item.description, locale)}
                </p>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </Container>
    </section>
  );
}
