"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { fadeInUp } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";

interface AboutVisionProps {
  data: AboutPageSettings["vision"];
  locale: string;
}

export function AboutVision({ data, locale }: AboutVisionProps) {
  const reduceMotion = useReducedMotion();
  const title = pickLocalized(data.title, locale);
  const body = pickLocalized(data.body, locale);
  const images = data.images.slice(0, 2);

  return (
    <section className="border-t border-oboya-green/35 bg-white py-[clamp(4.5rem,10vw,8rem)]">
      <Container>
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "visible"}
          viewport={{ once: true, margin: "-80px" }}
          variants={reduceMotion ? undefined : fadeInUp}
          className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12"
        >
          <div className="lg:col-span-7">
            <h2 className="font-display text-[clamp(2.25rem,5vw,3.75rem)] font-light tracking-[-0.02em] text-oboya-blue-dark">
              {title}
            </h2>
            <p className="mt-6 max-w-xl font-body text-[0.9375rem] leading-[1.75] text-oboya-blue-dark/65 md:text-base">
              {body}
            </p>
          </div>

          <div
            className={cn(
              "grid gap-4 sm:gap-5 lg:col-span-5",
              images.length > 1 && "grid-cols-2"
            )}
          >
            {images.map((img, i) => (
              <div
                key={`${i}-${img.src}`}
                className={cn(
                  "relative aspect-[4/3] overflow-hidden rounded-md bg-oboya-soft-white",
                  images.length === 1 && "max-h-[22rem] w-full"
                )}
              >
                <Image
                  src={img.src}
                  alt={pickLocalized(img.alt, locale)}
                  fill
                  className="object-cover"
                  sizes={
                    images.length === 1
                      ? "(max-width: 1024px) 100vw, 380px"
                      : "(max-width: 1024px) 50vw, 190px"
                  }
                />
              </div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
