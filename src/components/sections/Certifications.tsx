"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { fadeInUp } from "@/lib/animations";

export function Certifications() {
  const t = useTranslations("certifications");

  const items = ["BRCGS", "Sedex", "SMETA", "FSC", "ISO"] as const;

  return (
    <section className="border-y border-border/60 bg-white py-[var(--section-y-sm)]">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="flex flex-col items-center gap-10"
        >
          <h2 className="text-center text-xl font-semibold text-oboya-blue md:text-2xl">
            {t("title")}
          </h2>
          <ul className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {items.map((cert) => (
              <li
                key={cert}
                className="flex h-12 min-w-[5rem] items-center justify-center rounded-lg border border-border/60 px-6 text-sm font-bold tracking-wider text-oboya-blue-dark uppercase"
              >
                {cert}
              </li>
            ))}
          </ul>
        </motion.div>
      </Container>
    </section>
  );
}
