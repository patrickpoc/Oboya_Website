"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { fadeInUp } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";

interface AboutHeroProps {
  data: AboutPageSettings["hero"];
  image: AboutPageSettings["institutionalImage"];
  locale: string;
  showImage?: boolean;
}

export function AboutHero({
  data,
  image,
  locale,
  showImage = true,
}: AboutHeroProps) {
  const eyebrow = pickLocalized(data.eyebrow, locale);
  const title = pickLocalized(data.title, locale);
  const alt = pickLocalized(image.alt, locale);

  return (
    <section className="bg-white">
      <Container>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mx-auto max-w-[min(100%,52rem)] pt-[clamp(4.5rem,10vw,7.5rem)] pb-[clamp(4rem,9vw,7rem)] text-center lg:max-w-[78%]"
        >
          <p className="mb-5 font-body text-[0.8125rem] font-normal tracking-[0.02em] text-oboya-blue-dark/45 md:mb-7 md:text-sm">
            {eyebrow}
          </p>
          <h1 className="font-display text-[clamp(1.625rem,3.2vw,2.875rem)] font-semibold leading-[1.28] tracking-[-0.015em] text-oboya-blue-dark text-pretty">
            {title}
          </h1>
        </motion.div>
      </Container>

      {showImage && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[2.35/1] min-h-[200px] w-full overflow-hidden md:min-h-[340px] lg:min-h-[440px]"
          aria-label={alt}
        >
          <Image
            src={image.src}
            alt={alt}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </motion.div>
      )}
    </section>
  );
}
