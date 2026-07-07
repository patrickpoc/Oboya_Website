"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Leaf,
  Package,
  Recycle,
  Sprout,
  Truck,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionTitle } from "@/components/ui/section-title";
import { Link } from "@/i18n/navigation";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

export function Solutions() {
  const t = useTranslations("solutions");

  const items = [
    { title: t("propagationTitle"), description: t("propagationDesc"), icon: Sprout, href: "/solutions/propagation" },
    { title: t("packagingTitle"), description: t("packagingDesc"), icon: Package, href: "/solutions/packaging" },
    { title: t("sustainableTitle"), description: t("sustainableDesc"), icon: Leaf, href: "/solutions/sustainability" },
    { title: t("distributionTitle"), description: t("distributionDesc"), icon: Truck, href: "/solutions/distribution" },
    { title: t("circularTitle"), description: t("circularDesc"), icon: Recycle, href: "/solutions/circular-economy" },
  ];

  return (
    <section className="bg-white py-[var(--section-y)]">
      <Container>
        <SectionTitle
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          align="center"
          className="mb-12 md:mb-16"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((solution, index) => {
            const Icon = solution.icon;
            return (
              <motion.div
                key={solution.href}
                variants={fadeInUp}
                className={cn(index === 0 && "sm:col-span-2 lg:col-span-1")}
              >
                <Link
                  href={solution.href}
                  className="group flex h-full flex-col rounded-2xl border border-border/60 bg-oboya-soft-white p-8 transition-all hover:border-oboya-green/30 hover:shadow-[var(--shadow-subtle)]"
                >
                  <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-oboya-green/10 text-oboya-green transition-colors group-hover:bg-oboya-green group-hover:text-white">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-oboya-blue-dark">
                    {solution.title}
                  </h3>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {solution.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-oboya-green">
                    {t("explore")}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
