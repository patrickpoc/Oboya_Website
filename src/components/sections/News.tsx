"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionTitle } from "@/components/ui/section-title";
import { Link } from "@/i18n/navigation";
import { homepageImages } from "@/constants/homepage-images";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export function News() {
  const t = useTranslations("news");

  const items = [
    {
      title: t("item1Title"),
      image: homepageImages.greenhouseTechnology,
      href: "/news/greenhouse-technology",
    },
    {
      title: t("item2Title"),
      image: homepageImages.asiaPacificExpansion,
      href: "/news/asia-pacific-expansion",
    },
  ];

  return (
    <section className="bg-oboya-soft-white py-[var(--section-y-sm)]">
      <Container>
        <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <SectionTitle
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
          />
          <Link
            href="/news"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-oboya-blue transition-colors hover:text-oboya-green"
          >
            {t("viewAll")}
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-6 md:grid-cols-2"
        >
          {items.map((item) => (
            <motion.article
              key={item.href}
              variants={fadeInUp}
              className="group overflow-hidden rounded-2xl border border-border/60 bg-white shadow-[var(--shadow-subtle)] transition-shadow hover:shadow-[var(--shadow-card)]"
            >
              <Link href={item.href} className="flex flex-col sm:flex-row">
                <div className="relative aspect-[16/10] sm:aspect-auto sm:w-2/5">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 240px"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-center p-6">
                  <h3 className="text-lg font-semibold leading-snug text-oboya-blue-dark transition-colors group-hover:text-oboya-green">
                    {item.title}
                  </h3>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-oboya-blue">
                    {t("readMore")}
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
