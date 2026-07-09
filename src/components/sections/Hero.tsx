"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight, Cherry, Flower2, Sprout } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

export function Hero() {
  const t = useTranslations("hero");

  const categories = [
    { label: t("categoryVegetable"), href: "/solutions/vegetables", icon: Sprout },
    { label: t("categoryFlower"), href: "/solutions/flowers", icon: Flower2 },
    { label: t("categoryFruit"), href: "/solutions/fruits", icon: Cherry },
  ] as const;

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-oboya-blue-dark">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=2070&auto=format&fit=crop"
          alt={t("title")}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-oboya-blue-dark/80 via-oboya-blue-dark/50 to-oboya-blue-dark/40" />
        <div className="absolute inset-x-0 bottom-0 z-[1] h-48 bg-gradient-to-b from-transparent via-oboya-blue-dark/70 to-oboya-blue-dark md:h-64" />
      </div>

      <Container className="relative z-10 flex flex-1 flex-col pt-20 md:pt-24">
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center md:py-16">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex max-w-4xl flex-col items-center gap-6"
          >
            <motion.p
              variants={fadeInUp}
              className="text-sm font-medium tracking-[0.2em] text-white/90 uppercase"
            >
              {t("eyebrow")}
            </motion.p>

            <motion.h1
              variants={fadeInUp}
              className="font-display text-[var(--text-display)] leading-[var(--text-display-leading)] font-bold tracking-tight text-white text-balance drop-shadow-sm"
            >
              {t("title")}
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="max-w-2xl text-[var(--text-subtitle)] leading-[var(--text-subtitle-leading)] text-white/90 text-pretty"
            >
              {t("description")}
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-4 flex flex-col items-center gap-4 sm:flex-row"
            >
              <Link
                href="/shop"
                className={buttonVariants({
                  size: "lg",
                  className:
                    "h-12 rounded-full bg-oboya-green px-8 text-base font-semibold text-white hover:bg-oboya-green/90",
                })}
              >
                {t("ctaPrimary")}
                <ArrowRight className="ml-1 size-4" />
              </Link>
              <Link
                href="/about"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className:
                    "h-12 rounded-full border-white/40 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20 hover:text-white",
                })}
              >
                {t("ctaSecondary")}
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-2xl pb-16 md:pb-24"
        >
          <div
            className={cn(
              "flex items-stretch justify-between gap-1 rounded-full p-1.5",
              "border border-white/20 bg-white/10 backdrop-blur-xl"
            )}
          >
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.href}
                  href={category.href}
                  className="group flex flex-1 flex-col items-center gap-1 rounded-full px-3 py-3 transition-all hover:bg-white/15 sm:px-4"
                >
                  <Icon className="size-5 text-white/90 transition-transform group-hover:scale-110" />
                  <span className="text-sm font-semibold text-white">{category.label}</span>
                  <span className="text-[10px] tracking-wider text-white/65 uppercase">
                    {t("categorySublabel")}
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
