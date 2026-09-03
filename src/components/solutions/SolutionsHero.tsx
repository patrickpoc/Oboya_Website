"use client";

import { useMemo, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
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

function splitTaglineLines(tagline: string): string[] {
  return tagline
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function HeroOverlay({ usePageBackdrop }: { usePageBackdrop?: boolean }) {
  return (
    <>
      <div
        className={cn(
          "absolute inset-0",
          usePageBackdrop ? "bg-black/55" : "bg-oboya-blue-dark/70"
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
  const lines = useMemo(() => splitTaglineLines(tagline), [tagline]);

  return (
    <motion.div
      variants={staggerContainer}
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? undefined : "visible"}
      className="mx-auto flex h-full min-h-[inherit] w-full max-w-[var(--container-max)] flex-col px-[var(--container-padding)] py-[clamp(3rem,8vw,5rem)] text-left"
    >
      <div className="flex w-full max-w-3xl flex-1 flex-col justify-between">
        <motion.h1
          variants={fadeInUp}
          className="whitespace-nowrap font-display text-[clamp(1.25rem,4.2vw,3rem)] font-bold leading-[1.15] tracking-[-0.02em] text-white"
        >
          {headline}
        </motion.h1>

        <motion.div
          variants={fadeInUp}
          className="space-y-0.5 font-body text-[clamp(1.05rem,1.8vw,1.25rem)] font-normal leading-[1.45] text-white/95"
        >
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </motion.div>

        <motion.p
          variants={fadeInUp}
          className="max-w-2xl font-body text-[0.9375rem] font-medium leading-[1.6] text-white/90 md:text-base md:leading-[1.65]"
        >
          {body}
        </motion.p>

        <motion.p
          variants={fadeInUp}
          className="max-w-2xl font-body text-[0.9375rem] font-bold leading-[1.6] text-white md:text-base md:leading-[1.65]"
        >
          {accent}
        </motion.p>
      </div>
    </motion.div>
  );
}

function FullHeroShell({
  usePageBackdrop,
  children,
}: {
  usePageBackdrop?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative z-10 flex min-h-[inherit] w-full flex-col justify-center">
      <HeroOverlay usePageBackdrop={usePageBackdrop} />
      <div className="relative z-10 flex min-h-[inherit] w-full flex-col">
        {children}
      </div>
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
        <FullHeroShell>
          <motion.div
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "visible"}
            variants={reduceMotion ? undefined : fadeInUp}
            className="mx-auto flex min-h-[inherit] w-full max-w-[var(--container-max)] items-center px-[var(--container-padding)] py-[clamp(3rem,8vw,5rem)] text-left"
          >
            <h1 className="max-w-3xl font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-[1.2] tracking-[-0.02em] text-white text-pretty">
              {props.title}
            </h1>
          </motion.div>
        </FullHeroShell>
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

      <FullHeroShell usePageBackdrop={usePageBackdrop}>
        <IndexHeroContent
          headline={props.headline}
          tagline={props.tagline}
          body={props.body}
          accent={props.accent}
          reduceMotion={reduceMotion}
        />
      </FullHeroShell>
    </section>
  );
}
