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
  return (
    <section className="bg-oboya-blue-dark py-[clamp(5.5rem,12vw,9rem)]">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="max-w-4xl"
        >
          <p className="font-display text-[clamp(1.35rem,2.8vw,2.25rem)] font-normal leading-[1.45] tracking-[-0.01em]">
            {data.segments.map((segment, index) => {
              const text = pickLocalized(segment.text, locale);
              const className =
                segment.tone === "green" ? "text-oboya-green" : "text-white";
              return (
                <span key={index} className={className}>
                  {segment.breakBefore ? <br /> : null}
                  {text}
                </span>
              );
            })}
          </p>
          {data.body ? (
            <p className="mt-8 font-body text-[0.9375rem] leading-relaxed text-white/65">
              {pickLocalized(data.body, locale)}
            </p>
          ) : null}
        </motion.div>
      </Container>
    </section>
  );
}
