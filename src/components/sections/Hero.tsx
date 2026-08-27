"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { pickLocalized } from "@/lib/cms/utils";

interface HeroProps {
  data: HomepageSettings["hero"];
  locale: string;
  animationsEnabled?: boolean;
}

export function Hero({
  data,
  locale,
  animationsEnabled = true,
}: HeroProps) {
  const title = pickLocalized(data.title, locale);
  const eyebrow = pickLocalized(data.eyebrow, locale);
  const description = pickLocalized(data.description, locale);
  const titleLines = title.includes("\n")
    ? title.split("\n")
    : (() => {
        const match = title.match(/^(.*?partner)\s+(for\s+horticulture!?)$/i);
        return match ? [match[1], match[2]] : [title];
      })();

  const primaryLabel = pickLocalized(data.ctaPrimary.label, locale);
  const secondaryLabel = pickLocalized(data.ctaSecondary.label, locale);

  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-oboya-blue-dark"
    >
      <div className="absolute inset-0">
        <Image
          src={data.backgroundImage}
          alt={title.replace(/\n/g, " ")}
          fill
          priority
          className="object-cover object-[center_40%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-oboya-blue-dark/92" />
        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-transparent to-oboya-blue-dark" />
      </div>

      <Container className="relative z-10 flex flex-1 flex-col pt-20 md:pt-24">
        <div className="flex flex-1 flex-col items-center justify-center px-2 pb-16 pt-8 text-center md:pb-20">
          <motion.div
            variants={staggerContainer}
            initial={false}
            animate={animationsEnabled ? "visible" : undefined}
            className="flex max-w-3xl flex-col items-center"
          >
            {eyebrow ? (
              <motion.p
                variants={fadeInUp}
                className="mb-4 text-sm font-semibold tracking-[0.18em] text-[#c9b85c] uppercase md:mb-5 md:text-[0.9375rem]"
              >
                {eyebrow}
              </motion.p>
            ) : null}

            <motion.h1
              variants={fadeInUp}
              className="font-display text-[clamp(2.35rem,6.5vw,4.5rem)] leading-[1.05] font-black tracking-[-0.02em] text-white"
            >
              {titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </motion.h1>

            {description ? (
              <motion.p
                variants={fadeInUp}
                className="mt-5 max-w-2xl font-body text-[clamp(0.95rem,1.6vw,1.125rem)] leading-relaxed font-normal text-white/95 md:mt-6"
              >
                {description}
              </motion.p>
            ) : null}

            <motion.div
              variants={fadeInUp}
              className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:items-center"
            >
              <Link
                href={data.ctaPrimary.href || "/contact"}
                className={cn(
                  buttonVariants({ size: "cta" }),
                  "rounded-full bg-oboya-green px-8 text-white hover:bg-oboya-green/90"
                )}
              >
                {primaryLabel}
                <span aria-hidden className="ml-1">
                  →
                </span>
              </Link>
              <Link
                href={data.ctaSecondary.href || "/solutions"}
                className={cn(
                  buttonVariants({ size: "cta" }),
                  "rounded-full bg-white px-8 text-oboya-green hover:bg-white/90"
                )}
              >
                {secondaryLabel}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
