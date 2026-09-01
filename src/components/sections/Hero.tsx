"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { pickLocalized } from "@/lib/cms/utils";
import { HeroMedia, HeroMediaGradients } from "@/components/sections/HeroMedia";
import { useHomeScrollBackdrop } from "@/components/sections/HomePageBackdrop";

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
  const title = pickLocalized(data.title, locale)
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/!$/, "");
  const eyebrow = pickLocalized(data.eyebrow, locale);
  const description = pickLocalized(data.description, locale);

  const primaryLabel = pickLocalized(data.ctaPrimary.label, locale);
  const secondaryLabel = pickLocalized(data.ctaSecondary.label, locale);
  const alt = title;
  const useScrollBackdrop = useHomeScrollBackdrop();

  return (
    <section
      id="hero"
      className={cn(
        "relative flex min-h-[100svh] flex-col overflow-hidden",
        useScrollBackdrop ? "bg-transparent" : "bg-oboya-blue-dark"
      )}
    >
      {!useScrollBackdrop ? (
        <HeroMedia
          mediaType={data.mediaType ?? "image"}
          imageSrc={data.backgroundImage}
          videoSrc={data.backgroundVideo}
          alt={alt}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <HeroMediaGradients />
        </div>
      )}

      <Container className="relative z-10 flex flex-1 flex-col pt-20 md:pt-24">
        <div className="flex flex-1 flex-col items-center justify-center px-2 pb-20 pt-10 text-center md:pb-20">
          <motion.div
            variants={staggerContainer}
            initial={animationsEnabled ? "hidden" : false}
            animate={animationsEnabled ? "visible" : false}
            className="flex w-full max-w-4xl flex-col items-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="font-display text-[clamp(2rem,6.5vw,4.5rem)] leading-[1.05] font-black tracking-[-0.02em] text-white text-balance"
            >
              {title}
            </motion.h1>

            {description ? (
              <motion.p
                variants={fadeInUp}
                className="mt-5 max-w-3xl whitespace-pre-line text-center font-body text-[clamp(0.95rem,1.6vw,1.125rem)] leading-relaxed font-normal text-white/95 md:mt-6"
              >
                {description}
              </motion.p>
            ) : null}

            {eyebrow ? (
              <motion.p
                variants={fadeInUp}
                className="mt-5 text-balance text-center text-sm font-semibold tracking-[0.18em] text-oboya-yellow-light uppercase md:mt-6 md:text-[0.9375rem]"
              >
                {eyebrow}
              </motion.p>
            ) : null}

            <motion.div
              variants={fadeInUp}
              className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:mt-10 sm:w-auto sm:flex-row"
            >
              <Link
                href={data.ctaPrimary.href || "/contact"}
                className={cn(
                  buttonVariants({ size: "cta-lg" }),
                  "rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
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
                  buttonVariants({ size: "cta-lg" }),
                  "rounded-full bg-white text-oboya-green hover:bg-white/90"
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
