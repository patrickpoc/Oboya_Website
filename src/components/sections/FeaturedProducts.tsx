"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { buttonVariants } from "@/components/ui/button";

export function FeaturedProducts() {
  const t = useTranslations("featuredProducts");
  const tCommon = useTranslations("common");

  const products = [
    {
      id: "strawberry-packaging",
      title: t("strawberryTitle"),
      category: t("strawberryCategory"),
      image:
        "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=800&auto=format&fit=crop",
      href: "/products/strawberry-packaging",
    },
    {
      id: "growing-media",
      title: t("growingMediaTitle"),
      category: t("growingMediaCategory"),
      image:
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800&auto=format&fit=crop",
      href: "/products/growing-media",
    },
    {
      id: "flower-trolley",
      title: t("flowerTrolleyTitle"),
      category: t("flowerTrolleyCategory"),
      image:
        "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=800&auto=format&fit=crop",
      href: "/products/flower-trolley",
    },
  ];

  return (
    <section className="bg-oboya-soft-white py-[var(--section-y)]">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="mx-auto mb-12 max-w-3xl text-center md:mb-16"
        >
          <p className="mb-4 text-sm font-medium tracking-[0.2em] text-oboya-green uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="font-display text-[var(--text-heading)] leading-[var(--text-heading-leading)] font-semibold tracking-tight text-oboya-green text-balance">
            {t("title")}
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-6 md:grid-cols-3"
        >
          {products.map((product) => (
            <motion.article
              key={product.id}
              variants={fadeInUp}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white shadow-[var(--shadow-subtle)] transition-shadow hover:shadow-[var(--shadow-card)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-white">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div>
                  <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    {product.category}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-oboya-blue-dark">
                    {product.title}
                  </h3>
                </div>
                <Link
                  href={product.href}
                  className={buttonVariants({
                    variant: "outline",
                    className:
                      "mt-auto w-fit rounded-full border-oboya-blue/20 text-oboya-blue hover:bg-oboya-blue hover:text-white",
                  })}
                >
                  {tCommon("learnMore")}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="mt-12 flex justify-center"
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-oboya-blue transition-colors hover:text-oboya-green"
          >
            {t("viewAll")}
            <ChevronDown className="size-4" />
          </Link>
        </motion.div>
      </Container>
    </section>
  );
}
