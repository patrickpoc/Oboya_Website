"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";

interface AboutInstitutionalImageProps {
  data: AboutPageSettings["institutionalImage"];
  locale: string;
}

export function AboutInstitutionalImage({
  data,
  locale,
}: AboutInstitutionalImageProps) {
  const reduceMotion = useReducedMotion();
  const alt = pickLocalized(data.alt, locale);

  return (
    <section
      aria-label={alt}
      className="w-full bg-white pb-[clamp(3.5rem,8vw,6rem)]"
    >
      <Container>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-oboya-soft-white md:aspect-[21/9]"
        >
          <Image
            src={data.src}
            alt={alt}
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1280px) 100vw, 1200px"
          />
        </motion.div>
      </Container>
    </section>
  );
}
