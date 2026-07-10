"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { InteractiveWorldMap } from "@/components/sections/InteractiveWorldMap";
import { fadeInUp } from "@/lib/animations";
import type { ResolvedMapLocation } from "@/lib/map-locations";

interface GlobalPresenceProps {
  locations: ResolvedMapLocation[];
  mapAlt: string;
  title?: string;
}

export function GlobalPresence({ locations, mapAlt, title }: GlobalPresenceProps) {
  const t = useTranslations("globalPresence");
  const heading = title ?? t("title");

  return (
    <section id="global-presence" className="bg-white py-[var(--section-y)]">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="mb-10 md:mb-14"
        >
          <h2 className="mx-auto max-w-3xl text-center font-display text-[clamp(1.35rem,2.4vw,2rem)] leading-[1.35] font-black tracking-tight text-oboya-blue-dark text-balance">
            {heading}
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="relative mx-auto w-full max-w-3xl md:max-w-4xl"
        >
          <InteractiveWorldMap
            locations={locations}
            mapAlt={mapAlt}
          />
        </motion.div>
      </Container>
    </section>
  );
}
