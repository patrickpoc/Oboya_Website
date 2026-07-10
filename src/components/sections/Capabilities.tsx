"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";

interface CapabilitiesProps {
  data: HomepageSettings["capabilities"];
  locale: string;
}

export function Capabilities({ data, locale }: CapabilitiesProps) {
  return (
    <section className="bg-oboya-soft-white py-[var(--section-y)]">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="mb-10 md:mb-14"
        >
          <div className="mb-6 flex items-center gap-4">
            <p className="shrink-0 text-sm font-semibold tracking-wide text-oboya-blue-dark">
              {pickLocalized(data.eyebrow, locale)}
            </p>
            <div className="h-px flex-1 bg-oboya-blue-dark/80" aria-hidden />
          </div>
          <h2 className="max-w-4xl font-display text-[clamp(1.45rem,2.6vw,2.15rem)] leading-[1.35] font-medium tracking-tight text-oboya-blue-dark text-balance">
            {pickLocalized(data.title, locale)}
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-4 sm:gap-5 md:grid-cols-3"
        >
          {data.items.map((item) => {
            const title = pickLocalized(item.title, locale);
            const description = pickLocalized(item.description, locale);

            return (
              <motion.article key={item.id} variants={fadeInUp}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative block aspect-[302/290] overflow-hidden",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oboya-blue-dark"
                  )}
                >
                  <Image
                    src={item.image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10 transition-opacity duration-300 group-hover:from-black/85"
                    aria-hidden
                  />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-4 md:p-5">
                    <h3 className="text-sm font-bold text-white md:text-[0.95rem]">
                      {title}
                    </h3>
                    <p className="mt-1.5 max-w-[95%] text-[11px] leading-snug text-white/95 md:text-xs md:leading-snug">
                      {description}
                    </p>
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="mt-10 flex justify-center md:mt-14"
        >
          <Link
            href={data.ctaHref}
            className="inline-flex items-center rounded-full border border-oboya-blue-dark px-7 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-oboya-blue-dark uppercase transition-colors hover:bg-oboya-blue-dark hover:text-white"
          >
            {pickLocalized(data.ctaLabel, locale)}
          </Link>
        </motion.div>
      </Container>
    </section>
  );
}
