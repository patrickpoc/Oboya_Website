"use client";

import Image from "next/image";
import { motion } from "framer-motion";
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
  const alt = pickLocalized(data.alt, locale);

  return (
    <section aria-label={alt} className="relative w-full overflow-hidden bg-oboya-soft-white">
      <motion.div
        initial={{ opacity: 0, scale: 1.03 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative aspect-[21/9] min-h-[220px] w-full md:min-h-[320px] lg:aspect-[2.4/1] lg:min-h-[420px]"
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
