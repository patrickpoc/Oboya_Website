"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { fadeInUp } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import { cn } from "@/lib/utils";

interface AboutCorporateCultureProps {
  data: AboutPageSettings["culture"];
  locale: string;
}

export function AboutCorporateCulture({
  data,
  locale,
}: AboutCorporateCultureProps) {
  return (
    <section className="bg-white py-[clamp(5.5rem,12vw,10rem)]">
      <Container>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="mb-14 font-body text-[0.8125rem] font-medium tracking-[0.04em] text-oboya-green md:mb-20 md:text-sm"
        >
          {pickLocalized(data.eyebrow, locale)}
        </motion.p>

        <div className="flex flex-col gap-[clamp(4.5rem,11vw,8.5rem)]">
          {data.items.map((item) => {
            const imageLeft = item.imageSide === "left";
            return (
              <motion.article
                key={item.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={fadeInUp}
                className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14"
              >
                <div
                  className={cn(
                    "lg:col-span-5",
                    imageLeft ? "lg:order-2 lg:col-start-8" : "lg:col-start-1"
                  )}
                >
                  <h3 className="max-w-sm font-display text-[clamp(1.5rem,2.6vw,2.125rem)] font-semibold leading-[1.2] tracking-[-0.02em] text-oboya-blue-dark">
                    {pickLocalized(item.title, locale)}
                  </h3>
                  <p className="mt-5 max-w-md font-body text-[0.9375rem] leading-[1.7] text-oboya-blue-dark/55 md:text-base">
                    {pickLocalized(item.description, locale)}
                  </p>
                </div>

                <div
                  className={cn(
                    "relative lg:col-span-6",
                    imageLeft
                      ? "lg:order-1 lg:col-start-1"
                      : "lg:col-start-7"
                  )}
                >
                  {/* Offset geometric block behind image (reference layered depth) */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-oboya-soft-white",
                      imageLeft
                        ? "-translate-x-4 translate-y-4 md:-translate-x-6 md:translate-y-6"
                        : "translate-x-4 translate-y-4 md:translate-x-6 md:translate-y-6"
                    )}
                    aria-hidden
                  />
                  <div className="relative aspect-[5/4] overflow-hidden bg-oboya-soft-white">
                    <Image
                      src={item.image}
                      alt={pickLocalized(item.imageAlt, locale)}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 48vw"
                    />
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
