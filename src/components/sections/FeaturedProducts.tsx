"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { fadeInUp } from "@/lib/animations";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";

interface FeaturedProductsProps {
  data: HomepageSettings["featuredProducts"];
  locale: string;
  animationsEnabled?: boolean;
}

export function FeaturedProducts({
  data,
  locale,
  animationsEnabled = true,
}: FeaturedProductsProps) {
  const items = data.items ?? [];

  return (
    <section className="bg-oboya-soft-white py-[var(--section-y)]">
      <Container>
        <motion.div
          initial={animationsEnabled ? "hidden" : false}
          whileInView={animationsEnabled ? "visible" : undefined}
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="mb-10 md:mb-14"
        >
          <p className="text-sm font-medium tracking-wide text-oboya-green">
            {pickLocalized(data.eyebrow, locale)}
          </p>
          <div className="mt-3 h-px w-full bg-oboya-green/55" aria-hidden />
          <h2 className="mt-6 max-w-5xl font-display text-[clamp(1.45rem,2.6vw,2.15rem)] leading-[1.35] font-light tracking-tight text-oboya-blue-dark text-balance">
            {pickLocalized(data.title, locale)}
          </h2>
        </motion.div>

        <motion.div
          initial={animationsEnabled ? "hidden" : false}
          whileInView={animationsEnabled ? "visible" : undefined}
          viewport={{ once: true, margin: "-80px" }}
          variants={
            animationsEnabled
              ? {
                  hidden: {},
                  visible: {
                    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
                  },
                }
              : undefined
          }
          className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8"
        >
          {items.map((item) => {
            const title = pickLocalized(item.title, locale);
            const description = pickLocalized(item.description, locale);
            const ctaLabel =
              (item.ctaLabel != null &&
                pickLocalized(item.ctaLabel, locale).trim()) ||
              (data.ctaLabel != null &&
                pickLocalized(data.ctaLabel, locale).trim()) ||
              "Learn More";
            const href = item.ctaHref || data.ctaHref || "/shop";

            return (
              <motion.article
                key={item.id}
                variants={animationsEnabled ? fadeInUp : undefined}
                className="flex h-full flex-col bg-white px-5 pt-6 pb-6 shadow-[var(--shadow-subtle)] md:px-6 md:pt-7 md:pb-7"
              >
                <h3 className="min-h-[1.75em] font-display text-lg font-bold leading-snug text-oboya-blue-dark md:min-h-[1.75em] md:text-xl">
                  {title}
                </h3>
                <p className="mt-2.5 line-clamp-3 min-h-[4.5em] text-sm leading-relaxed text-oboya-blue-dark/60 md:min-h-[4.65em] md:text-[0.9375rem]">
                  {description}
                </p>

                <div className="relative mt-5 aspect-[4/3] w-full overflow-hidden bg-oboya-soft-white">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : null}
                </div>

                <div className="mt-auto flex justify-center pt-5">
                  <Link
                    href={href}
                    className={cn(
                      buttonVariants({
                        size: "cta",
                        variant: "outline",
                      }),
                      "rounded-full border-oboya-green bg-transparent px-6 text-xs font-semibold tracking-[0.08em] text-oboya-green uppercase hover:bg-oboya-green hover:text-white"
                    )}
                  >
                    {ctaLabel}
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
