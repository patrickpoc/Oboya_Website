"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";

interface AboutValuesProps {
  data: AboutPageSettings["values"];
  locale: string;
}

export function AboutValues({ data, locale }: AboutValuesProps) {
  const title = pickLocalized(data.title, locale);
  const top = data.items.slice(0, 3);
  const bottom = data.items.slice(3);

  return (
    <section className="border-t border-oboya-green/35 bg-white py-[clamp(4.5rem,10vw,8rem)]">
      <Container>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="mb-10 text-center font-display text-[clamp(2.25rem,5vw,3.5rem)] font-light tracking-[-0.02em] text-oboya-blue-dark md:mb-14"
        >
          {title}
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="mx-auto flex max-w-5xl flex-col gap-4 sm:gap-5 lg:gap-6"
        >
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {top.map((item) => (
              <ValueCard key={item.id} item={item} locale={locale} />
            ))}
          </ul>
          {bottom.length > 0 ? (
            <ul className="mx-auto grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:max-w-[calc(66.666%-0.75rem)] lg:gap-6">
              {bottom.map((item) => (
                <ValueCard key={item.id} item={item} locale={locale} />
              ))}
            </ul>
          ) : null}
        </motion.div>
      </Container>
    </section>
  );
}

function ValueCard({
  item,
  locale,
}: {
  item: AboutPageSettings["values"]["items"][number];
  locale: string;
}) {
  return (
    <motion.li variants={fadeInUp} className="h-full list-none">
      <article className="flex h-full flex-col rounded-lg border border-oboya-green/25 bg-[#e8f3e8] px-5 py-6 md:px-6 md:py-7">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-oboya-green md:text-xl">
            {pickLocalized(item.title, locale)}
          </h3>
          <ArrowUpRight
            className="mt-0.5 size-4 shrink-0 text-oboya-green"
            aria-hidden
          />
        </div>
        <p className="font-body text-sm leading-relaxed text-oboya-blue-dark/70 md:text-[0.9375rem]">
          {pickLocalized(item.description, locale)}
        </p>
      </article>
    </motion.li>
  );
}
