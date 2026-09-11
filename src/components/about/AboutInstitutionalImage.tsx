"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
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
    <section aria-label={alt} className="relative w-full overflow-hidden bg-oboya-soft-white">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 1.02 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="relative aspect-[16/9] min-h-[14rem] w-full sm:min-h-[18rem] md:aspect-[21/9] md:min-h-[22rem] lg:min-h-[26rem]"
      >
        <Image
          src={data.src}
          alt={alt}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </motion.div>
    </section>
  );
}
