"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";

interface AboutHonorsProps {
  data: AboutPageSettings["honors"];
  locale: string;
}

export function AboutHonors({ data, locale }: AboutHonorsProps) {
  return (
    <section className="bg-white pb-[clamp(5.5rem,12vw,9.5rem)] pt-[clamp(2rem,5vw,4rem)]">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="flex flex-col items-center gap-14 md:gap-16"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-center font-display text-[clamp(1.25rem,2.4vw,1.75rem)] font-normal tracking-[-0.01em] text-oboya-blue/70"
          >
            {pickLocalized(data.title, locale)}
          </motion.h2>

          <motion.ul
            variants={staggerContainer}
            className="flex w-full max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-10 md:justify-between md:gap-x-6"
          >
            {data.items.map((item) => (
              <motion.li key={item.id} variants={fadeInUp}>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block opacity-90 transition-opacity hover:opacity-100"
                  >
                    <HonorMark item={item} />
                  </a>
                ) : (
                  <HonorMark item={item} />
                )}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </Container>
    </section>
  );
}

function HonorMark({
  item,
}: {
  item: AboutPageSettings["honors"]["items"][number];
}) {
  const [failed, setFailed] = useState(false);

  if (!item.image || failed) {
    return (
      <span className="inline-flex min-h-12 max-w-[7.5rem] items-center justify-center text-center font-display text-[0.6875rem] font-bold leading-tight tracking-[0.06em] text-oboya-blue-dark uppercase md:min-h-14 md:text-xs">
        {item.name}
      </span>
    );
  }

  return (
    <div className="relative flex h-12 w-24 items-center justify-center md:h-14 md:w-28">
      <Image
        src={item.image}
        alt={item.name}
        fill
        className="object-contain"
        sizes="112px"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
