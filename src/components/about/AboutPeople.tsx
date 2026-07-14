"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import { cn } from "@/lib/utils";

interface AboutPeopleProps {
  data: AboutPageSettings["people"];
  locale: string;
  /** @deprecated Kept for callers; block is always the split feature layout. */
  scrollSpotlight?: boolean;
}

/**
 * Leadership feature block: structured copy + checklist on the left,
 * 2×2 portrait grid on the right (reference: split product feature).
 */
export function AboutPeople({ data, locale }: AboutPeopleProps) {
  const highlights = data.highlights?.length
    ? data.highlights
    : data.items.map((person) => ({
        id: person.id,
        text: person.role,
      }));

  return (
    <section className="bg-oboya-soft-white py-16 md:py-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14 xl:gap-16">
          {/* Left — title, intro, structured points */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="lg:col-span-5"
          >
            <motion.p
              variants={fadeInUp}
              className="font-body text-[0.8125rem] font-medium tracking-[0.04em] text-oboya-green md:text-sm"
            >
              {pickLocalized(data.eyebrow, locale)}
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              className="mt-4 max-w-md font-display text-[clamp(1.75rem,3.2vw,2.75rem)] font-semibold tracking-[-0.02em] text-oboya-blue-dark text-balance"
            >
              {pickLocalized(data.title, locale)}
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-4 max-w-md font-body text-[1.0625rem] leading-relaxed text-oboya-blue-dark/60"
            >
              {pickLocalized(data.description, locale)}
            </motion.p>

            <motion.ul
              variants={staggerContainer}
              className="mt-8 flex flex-col gap-4"
            >
              {highlights.map((item) => (
                <motion.li
                  key={item.id}
                  variants={fadeInUp}
                  className="flex items-start gap-3"
                >
                  <span
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-oboya-green/15 text-oboya-green"
                    aria-hidden
                  >
                    <Check className="size-3 stroke-[2.5]" />
                  </span>
                  <span className="font-body text-[1.0625rem] leading-snug text-oboya-blue-dark/80">
                    {pickLocalized(item.text, locale)}
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Right — 2×2 image grid */}
          <motion.ul
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-7"
          >
            {data.items.slice(0, 4).map((person, index) => (
              <motion.li
                key={person.id}
                variants={fadeInUp}
                className={cn(
                  "group relative overflow-hidden rounded-2xl bg-oboya-blue-dark/5 shadow-[0_12px_40px_-20px_rgb(1_32_63/28%)]",
                  index === 0 && "ring-2 ring-oboya-green/70 ring-offset-2 ring-offset-oboya-soft-white"
                )}
              >
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src={person.image}
                    alt={person.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                    sizes="(max-width: 1024px) 45vw, 22vw"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-oboya-blue-dark/75 via-oboya-blue-dark/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
                    <p className="font-display text-base font-semibold text-white sm:text-lg">
                      {person.name}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-white/75 sm:text-sm">
                      {pickLocalized(person.role, locale)}
                    </p>
                  </div>
                  <span className="absolute top-3 right-3 rounded-md bg-white/95 px-2.5 py-1 font-body text-[0.625rem] font-semibold tracking-[0.12em] text-oboya-blue-dark uppercase shadow-sm sm:text-xs">
                    {person.name.split(" ")[0]}
                  </span>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </Container>
    </section>
  );
}
