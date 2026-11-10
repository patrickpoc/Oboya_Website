"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Container } from "@/components/ui/container";
import { FaqPlusMinusIcon } from "@/components/faqs/FaqPlusMinusIcon";
import { fadeInUp } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import { cn } from "@/lib/utils";

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
          <Accordion multiple className="w-full">
            {data.items.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-0 border-t border-[#A3C9A8]/70 first:border-t not-last:border-b-0 last:border-b last:border-[#A3C9A8]/70"
              >
                <AccordionTrigger
                  className={cn(
                    "group/faq-trigger gap-5 rounded-none py-6 hover:no-underline sm:py-7",
                    "font-body text-[0.9375rem] font-medium tracking-[0.05em] text-oboya-blue-dark uppercase sm:text-base md:text-[1.0625rem]",
                    "items-center [&_[data-slot=accordion-trigger-icon]]:hidden"
                  )}
                >
                  <span className="min-w-0 flex-1 pr-2 text-left leading-snug">
                    {pickLocalized(item.title, locale)}
                  </span>
                  <FaqPlusMinusIcon />
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-base font-normal leading-relaxed text-oboya-blue-dark/60 normal-case tracking-normal sm:pb-7 sm:text-[1.0625rem] sm:leading-[1.7]">
                  <div className="whitespace-pre-line">
                    {pickLocalized(item.description, locale)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </Container>
    </section>
  );
}
