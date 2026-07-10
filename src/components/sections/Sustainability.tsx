"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Droplets, Leaf, Recycle, Sun } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionTitle } from "@/components/ui/section-title";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export function Sustainability() {
  const t = useTranslations("sustainability");

  const pillars = [
    { icon: Leaf, title: t("sourcingTitle"), description: t("sourcingDesc") },
    { icon: Recycle, title: t("packagingTitle"), description: t("packagingDesc") },
    { icon: Droplets, title: t("waterTitle"), description: t("waterDesc") },
    { icon: Sun, title: t("carbonTitle"), description: t("carbonDesc") },
  ];

  return (
    <section className="bg-white py-[var(--section-y)]">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionTitle
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  variants={fadeInUp}
                  className="rounded-xl border border-border/60 bg-oboya-soft-white p-6"
                >
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-oboya-green/10 text-oboya-green">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mb-2 font-semibold text-oboya-blue-dark">{pillar.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {pillar.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="mt-12 flex justify-center lg:justify-start"
        >
          <Link
            href="/sustainability"
            className={buttonVariants({
              size: "cta",
              className: "bg-oboya-green text-white hover:bg-oboya-green/90",
            })}
          >
            {t("cta")}
          </Link>
        </motion.div>
      </Container>
    </section>
  );
}
