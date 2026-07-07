"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionTitle } from "@/components/ui/section-title";
import { Link as LocaleLink } from "@/i18n/navigation";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export function Industries() {
  const t = useTranslations("industries");

  const items = [
    { title: t("greenhousesTitle"), description: t("greenhousesDesc"), href: "/industries/greenhouses" },
    { title: t("nurseriesTitle"), description: t("nurseriesDesc"), href: "/industries/nurseries" },
    { title: t("retailTitle"), description: t("retailDesc"), href: "/industries/retail" },
    { title: t("berriesTitle"), description: t("berriesDesc"), href: "/industries/berries" },
  ];

  return (
    <section className="border-t border-border/60 bg-oboya-soft-white py-[var(--section-y-sm)]">
      <Container>
        <SectionTitle
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          align="center"
          className="mb-10 md:mb-14"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {items.map((industry) => (
            <motion.div key={industry.href} variants={fadeInUp}>
              <LocaleLink
                href={industry.href}
                className="group flex h-full flex-col rounded-xl border border-border/60 bg-white p-6 transition-all hover:border-oboya-blue/20 hover:shadow-[var(--shadow-subtle)]"
              >
                <h3 className="mb-2 font-semibold text-oboya-blue-dark group-hover:text-oboya-green">
                  {industry.title}
                </h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {industry.description}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-oboya-green">
                  {t("discover")}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </LocaleLink>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
