"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { fadeInUp } from "@/lib/animations";

export function CallToAction() {
  const t = useTranslations("cta");

  return (
    <section className="bg-oboya-blue py-[var(--section-y)]">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="flex flex-col items-center text-center"
        >
          <h2 className="max-w-2xl font-display text-[var(--text-heading)] leading-[var(--text-heading-leading)] font-semibold tracking-tight text-white text-balance">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-xl text-[var(--text-body)] leading-[var(--text-body-leading)] text-white/75">
            {t("description")}
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/contact"
              className={buttonVariants({
                size: "lg",
                className:
                  "h-12 rounded-full bg-oboya-green px-8 text-base font-semibold text-white hover:bg-oboya-green/90",
              })}
            >
              {t("primary")}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/solutions"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className:
                  "h-12 rounded-full border-white/30 bg-transparent px-8 text-base font-semibold text-white hover:bg-white/10 hover:text-white",
              })}
            >
              {t("secondary")}
            </Link>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
