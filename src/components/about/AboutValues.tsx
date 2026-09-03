"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { ValuesSqueezeCarousel } from "@/components/about/ValuesSqueezeCarousel";
import { fadeInUp } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";

interface AboutValuesProps {
  data: AboutPageSettings["values"];
  locale: string;
}

export function AboutValues({ data, locale }: AboutValuesProps) {
  const title = pickLocalized(data.title, locale);

  return (
    <section className="border-t border-oboya-green/35 bg-white py-[clamp(4.5rem,10vw,8rem)]">
      <Container>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="mb-10 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-light tracking-[-0.02em] text-oboya-blue-dark md:mb-12"
        >
          {title}
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeInUp}
        >
          <ValuesSqueezeCarousel items={data.items} locale={locale} />
        </motion.div>
      </Container>
    </section>
  );
}
