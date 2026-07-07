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
}

export function GlobalPresence({ locations, mapAlt }: GlobalPresenceProps) {
  const t = useTranslations("globalPresence");

  return (
    <section className="bg-white py-[var(--section-y)]">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="mb-10 md:mb-14"
        >
          <h2 className="max-w-3xl font-display text-[clamp(1.5rem,2.5vw,2.25rem)] leading-[1.25] font-semibold tracking-tight text-oboya-blue-dark text-balance">
            {t("title")}
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="relative mx-auto w-full"
        >
          <InteractiveWorldMap
            locations={locations}
            mapAlt={mapAlt}
            interactiveHint={t("interactiveHint")}
          />
        </motion.div>
      </Container>
    </section>
  );
}
