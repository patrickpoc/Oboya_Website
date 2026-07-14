"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";

interface AboutImpactProps {
  data: AboutPageSettings["impact"];
  locale: string;
}

export function AboutImpact({ data, locale }: AboutImpactProps) {
  return (
    <section className="bg-white py-[clamp(5rem,12vw,9rem)]">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.p
            variants={fadeInUp}
            className="font-body text-[0.8125rem] font-medium tracking-[0.04em] text-oboya-green md:text-sm"
          >
            {pickLocalized(data.eyebrow, locale)}
          </motion.p>
          <motion.h2
            variants={fadeInUp}
            className="mt-4 font-display text-[clamp(1.75rem,3.2vw,2.75rem)] font-semibold tracking-[-0.02em] text-oboya-blue-dark text-balance"
          >
            {pickLocalized(data.title, locale)}
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mt-4 font-body text-[1.0625rem] leading-relaxed text-oboya-blue-dark/60"
          >
            {pickLocalized(data.description, locale)}
          </motion.p>
        </motion.div>

        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="mt-14 grid gap-8 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4"
        >
          {data.stats.map((stat) => (
            <motion.li
              key={stat.id}
              variants={fadeInUp}
              className="text-center"
            >
              <p className="font-display text-[clamp(2.5rem,5vw,3.75rem)] font-light leading-none tracking-tight text-oboya-blue-dark">
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  duration={2.4}
                />
              </p>
              <p className="mt-3 font-body text-sm text-oboya-blue-dark/55 md:text-base">
                {pickLocalized(stat.label, locale)}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}
