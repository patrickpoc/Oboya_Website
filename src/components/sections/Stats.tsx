"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const stats = [
  {
    value: 600,
    suffix: "+",
    label: "Production and Sales Locations",
  },
  {
    value: 80,
    suffix: "+",
    label: "Countries Served Worldwide",
  },
  {
    value: 20,
    suffix: "+",
    label: "Years of Experience",
  },
] as const;

export function Stats() {
  return (
    <section className="border-t border-white/10 bg-oboya-blue-dark py-[var(--section-y-sm)]">
      <Container>
        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-10 md:grid-cols-3 md:gap-8"
        >
          {stats.map((stat) => (
            <motion.li
              key={stat.label}
              variants={fadeInUp}
              className="flex flex-col gap-3 border-white/10 md:border-l md:pl-10 first:md:border-l-0 first:md:pl-0"
            >
              <span className="font-display text-5xl font-bold tracking-tight text-white md:text-6xl">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </span>
              <span className="max-w-[16rem] text-sm leading-relaxed text-white/70">
                {stat.label}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}
