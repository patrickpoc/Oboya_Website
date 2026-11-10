"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { fadeInUp } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";

interface AboutMissionProps {
  data: AboutPageSettings["mission"];
  locale: string;
}

export function AboutMission({ data, locale }: AboutMissionProps) {
  const reduceMotion = useReducedMotion();
  const title = pickLocalized(data.title, locale);
  const body = pickLocalized(data.body, locale);
  const image = data.images[0];

  return (
    <section className="border-t border-oboya-green/35 bg-white">
      <motion.div
        initial={reduceMotion ? false : "hidden"}
        whileInView={reduceMotion ? undefined : "visible"}
        viewport={{ once: true, margin: "-80px" }}
        variants={reduceMotion ? undefined : fadeInUp}
        className="grid lg:grid-cols-12"
      >
        <div className="flex items-center lg:col-span-7">
          <Container className="py-[clamp(4.5rem,10vw,8rem)] lg:max-w-none lg:pl-[max(var(--container-padding),calc((100vw-var(--container-max))/2+var(--container-padding)))] lg:pr-12">
            <h2 className="font-display text-[clamp(2.25rem,5vw,3.75rem)] font-light tracking-[-0.02em] text-oboya-blue-dark">
              {title}
            </h2>
            <p className="mt-6 max-w-xl font-body text-[0.9375rem] leading-[1.75] text-oboya-blue-dark/65 md:text-base">
              {body}
            </p>
          </Container>
        </div>

        {image ? (
          <div className="relative order-first aspect-[16/9] overflow-hidden bg-oboya-soft-white lg:order-none lg:col-span-5 lg:aspect-auto lg:min-h-full">
            <Image
              src={image.src}
              alt={pickLocalized(image.alt, locale)}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </div>
        ) : null}
      </motion.div>
    </section>
  );
}
