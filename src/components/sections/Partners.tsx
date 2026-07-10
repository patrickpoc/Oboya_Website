"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { fadeInUp } from "@/lib/animations";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { pickLocalized } from "@/lib/cms/utils";

interface PartnersProps {
  data: HomepageSettings["partners"];
  locale: string;
}

export function Partners({ data, locale }: PartnersProps) {
  return (
    <section className="bg-white py-[var(--section-y)]">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="flex flex-col items-center gap-8 md:gap-14"
        >
          <h2 className="max-w-2xl text-center font-display text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-tight text-oboya-blue-dark text-balance">
            {pickLocalized(data.title, locale)}
          </h2>
          <ul className="flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-6 md:gap-x-14 md:gap-y-10 lg:gap-x-16">
            {data.logos.map((logo) => {
              const content = logo.image ? (
                <Image
                  src={logo.image}
                  alt={logo.name}
                  width={200}
                  height={80}
                  className="h-10 w-auto max-w-[9rem] object-contain sm:h-12 sm:max-w-[11rem] md:h-14 md:max-w-[13rem]"
                />
              ) : (
                <span className="text-sm font-bold tracking-wider text-oboya-blue-dark/50 uppercase">
                  {logo.name}
                </span>
              );

              return (
                <li key={logo.id} className="flex h-14 items-center justify-center md:h-20">
                  {logo.href ? (
                    <Link href={logo.href} className="transition-opacity hover:opacity-90">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        </motion.div>
      </Container>
    </section>
  );
}
