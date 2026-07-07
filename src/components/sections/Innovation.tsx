"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { homepageImages } from "@/constants/homepage-images";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export function Innovation() {
  const t = useTranslations("innovation");

  const items = [
    {
      title: t("news1Title"),
      image: homepageImages.greenhouseTechnology,
      href: "/news/greenhouse-technology",
    },
    {
      title: t("news2Title"),
      image: homepageImages.asiaPacificExpansion,
      href: "/news/asia-pacific-expansion",
    },
  ];

  return (
    <section className="bg-oboya-blue-dark py-[var(--section-y)]">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="mb-12 max-w-3xl md:mb-16"
        >
          <p className="mb-4 text-sm font-medium tracking-[0.2em] text-white/60 uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="font-display text-[var(--text-heading)] leading-[var(--text-heading-leading)] font-semibold tracking-tight text-white text-balance">
            {t("title")}
          </h2>
          <p className="mt-6 text-[var(--text-body)] leading-[var(--text-body-leading)] text-white/70">
            {t("description")}
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-6 md:grid-cols-2"
        >
          {items.map((item) => (
            <motion.article key={item.href} variants={fadeInUp}>
              <Link
                href={item.href}
                className="group relative block overflow-hidden rounded-2xl"
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-oboya-blue-dark/90 via-oboya-blue-dark/20 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
                  <h3 className="max-w-sm text-lg font-semibold leading-snug text-white">
                    {item.title}
                  </h3>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm transition-colors group-hover:bg-oboya-green">
                    <ArrowUpRight className="size-4 text-white" />
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
