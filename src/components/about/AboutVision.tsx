"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { fadeInUp } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";

interface AboutVisionProps {
  data: AboutPageSettings["vision"];
  locale: string;
}

export function AboutVision({ data, locale }: AboutVisionProps) {
  const title = pickLocalized(data.title, locale);
  const body = pickLocalized(data.body, locale);
  const primary = data.images[0];
  const secondary = data.images[1];

  return (
    <section className="border-t border-oboya-green/35 bg-white py-[clamp(4.5rem,10vw,8rem)]">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="grid gap-8 lg:grid-cols-12 lg:gap-12 lg:items-start"
        >
          <h2 className="font-display text-[clamp(2.25rem,5vw,3.75rem)] font-light tracking-[-0.02em] text-oboya-blue-dark lg:col-span-4">
            {title}
          </h2>
          <p className="max-w-xl font-body text-[0.9375rem] leading-[1.75] text-oboya-blue-dark/60 md:text-base lg:col-span-7 lg:col-start-6 lg:pt-3">
            {body}
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-12 sm:gap-5 md:mt-14">
          {primary ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[16/10] overflow-hidden bg-oboya-soft-white sm:col-span-8"
            >
              <Image
                src={primary.src}
                alt={pickLocalized(primary.alt, locale)}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 66vw"
              />
            </motion.div>
          ) : null}
          {secondary ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.65,
                delay: 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative aspect-[4/5] overflow-hidden bg-oboya-soft-white sm:col-span-4 sm:aspect-auto sm:min-h-full"
            >
              <Image
                src={secondary.src}
                alt={pickLocalized(secondary.alt, locale)}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
            </motion.div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
