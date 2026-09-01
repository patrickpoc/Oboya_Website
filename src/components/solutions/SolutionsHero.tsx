"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { SolutionsHeroCarousel } from "@/components/solutions/SolutionsHeroCarousel";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface SolutionsHeroIndexProps {
  variant?: "index";
  headline: string;
  tagline: string;
  body: string;
  accent: string;
  images: string[];
  usePageBackdrop?: boolean;
}

interface SolutionsHeroCategoryProps {
  variant: "category";
  title: string;
  images: string[];
}

export type SolutionsHeroProps =
  | SolutionsHeroIndexProps
  | SolutionsHeroCategoryProps;

/** Full-viewport hero above the catalog (minus fixed navbar). */
const HERO_SECTION_CLASS =
  "relative min-h-[calc(100svh-4rem)] overflow-hidden md:min-h-[calc(100svh-5rem)]";

/** Mini hero band — vertically centered, height follows content + padding. */
const HERO_BAND_CLASS =
  "absolute top-1/2 right-0 left-0 z-10 w-full -translate-y-1/2";

function HeroBandOverlay({ usePageBackdrop }: { usePageBackdrop?: boolean }) {
  return (
    <>
      <div
        className={cn(
          "absolute inset-0",
          usePageBackdrop ? "bg-black/55" : "bg-oboya-blue-dark"
        )}
        aria-hidden
      />
      {usePageBackdrop ? (
        <div className="absolute inset-0 bg-oboya-blue-dark/45" aria-hidden />
      ) : null}
    </>
  );
}

function IndexHeroContent({
  headline,
  tagline,
  body,
  accent,
  reduceMotion,
}: {
  headline: string;
  tagline: string;
  body: string;
  accent: string;
  reduceMotion: boolean | null;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? undefined : "visible"}
      className="mx-auto flex w-full max-w-3xl flex-col items-center text-center"
    >
      <motion.h1
        variants={fadeInUp}
        className="max-w-2xl font-display text-[clamp(1.75rem,3.8vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-white text-balance"
      >
        {headline}
      </motion.h1>
      <motion.p
        variants={fadeInUp}
        className="mt-3 max-w-lg whitespace-pre-line font-display text-[clamp(1.05rem,1.75vw,1.25rem)] font-light leading-[1.35] tracking-[-0.01em] text-white/95 md:mt-4"
      >
        {tagline}
      </motion.p>

      <div className="mt-4 flex max-w-2xl flex-col gap-3 md:mt-5">
        <motion.p
          variants={fadeInUp}
          className="font-body text-[0.9375rem] leading-[1.65] text-white/85 md:text-base md:leading-[1.6]"
        >
          {body}
        </motion.p>
        <motion.p
          variants={fadeInUp}
          className="font-body text-[0.9375rem] font-bold leading-[1.6] text-oboya-yellow-light md:text-base"
        >
          {accent}
        </motion.p>
      </div>
    </motion.div>
  );
}

function CenteredHeroBand({
  usePageBackdrop,
  children,
}: {
  usePageBackdrop?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("relative", HERO_BAND_CLASS)}>
      <HeroBandOverlay usePageBackdrop={usePageBackdrop} />
      <Container className="relative z-10 w-full px-[var(--container-padding)] py-[clamp(1.25rem,3vw,2rem)] md:py-[clamp(1.5rem,3.5vw,2.25rem)]">
        {children}
      </Container>
    </div>
  );
}

export function SolutionsHero(props: SolutionsHeroProps) {
  const reduceMotion = useReducedMotion();

  if (props.variant === "category") {
    const alt = props.title;
    return (
      <section className={cn(HERO_SECTION_CLASS, "bg-oboya-blue-dark")}>
        <div className="absolute inset-0">
          <SolutionsHeroCarousel images={props.images} alt={alt} />
        </div>
        <CenteredHeroBand>
          <motion.div
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "visible"}
            variants={reduceMotion ? undefined : fadeInUp}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="font-display text-[clamp(1.35rem,2.5vw,1.875rem)] font-light leading-[1.2] tracking-[-0.02em] text-white text-pretty">
              {props.title}
            </h1>
          </motion.div>
        </CenteredHeroBand>
      </section>
    );
  }

  const usePageBackdrop = props.usePageBackdrop ?? false;

  return (
    <section className={HERO_SECTION_CLASS}>
      {!usePageBackdrop ? (
        <div className="absolute inset-0">
          <SolutionsHeroCarousel images={props.images} alt={props.headline} />
        </div>
      ) : null}

      <CenteredHeroBand usePageBackdrop={usePageBackdrop}>
        <IndexHeroContent
          headline={props.headline}
          tagline={props.tagline}
          body={props.body}
          accent={props.accent}
          reduceMotion={reduceMotion}
        />
      </CenteredHeroBand>
    </section>
  );
}
