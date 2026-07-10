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
          <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/contact"
              className={buttonVariants({
                size: "cta-lg",
                className:
                  "bg-oboya-green text-white hover:bg-oboya-green/90",
              })}
            >
              {t("primary")}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/case-studies"
              className={buttonVariants({
                variant: "outline",
                size: "cta-lg",
                className:
                  "border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white",
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
