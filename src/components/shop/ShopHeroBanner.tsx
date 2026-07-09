"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const SHOP_BANNER_IMAGE =
  "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=2070&auto=format&fit=crop";

export function ShopHeroBanner() {
  const t = useTranslations("shop");

  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="absolute inset-0">
        <Image
          src={SHOP_BANNER_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-oboya-blue-dark/80" />
        <div className="absolute inset-0 bg-gradient-to-b from-oboya-blue-dark/50 via-transparent to-oboya-blue-dark/70" />
      </div>

      <Container className="relative z-10 flex justify-center py-16 md:py-20">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex w-full max-w-2xl flex-col items-center text-center"
        >
          <motion.div
            variants={fadeInUp}
            className="-translate-x-3 flex w-[min(80vw,12.5rem)] flex-col items-center sm:w-[13.5rem] md:-translate-x-6 md:w-[14.5rem]"
          >
            <Link
              href="/"
              className="block w-full"
              aria-label="Oboya Horticulture"
            >
              <Image
                src="/assets/logo.svg"
                alt="Oboya Horticulture"
                width={1086}
                height={262}
                priority
                className="h-auto w-full brightness-0 invert"
              />
            </Link>

            <h1 className="mt-4 w-full whitespace-nowrap text-center font-display text-base font-semibold tracking-[0.2em] text-white uppercase sm:text-lg md:mt-5 md:text-xl">
              {t("bannerShop")}
            </h1>
          </motion.div>

          <motion.p
            variants={fadeInUp}
            className="mt-6 max-w-xl text-sm leading-relaxed text-white/90 text-pretty md:mt-8 md:text-base"
          >
            {t("bannerDescription")}
          </motion.p>
        </motion.div>
      </Container>
    </section>
  );
}
