"use client";

import Image from "next/image";
import { CircleCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SolutionsHero } from "@/components/solutions/SolutionsHero";
import { fadeInUp, revealViewport } from "@/lib/animations";
import { cn } from "@/lib/utils";

const HERO_IMAGE = "/assets/innovation/oboya-terra.jpg";
const CTA_IMAGE = "/assets/homepage/cta-flowers-field.jpg";
/** Placeholder: same photo for all rows until dedicated images exist. */
const WHY_IMAGE = "/assets/homepage/capabilities-partnerships.jpg";
const WHY_COUNT = 4;

const H2_CLASS =
  "text-center font-display text-[clamp(2rem,3.6vw,3rem)] font-light leading-[1.1] text-oboya-blue-dark text-balance";

export interface OboyaTerraCardData {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
}

function Reveal({ className, children }: { className?: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduce ? undefined : fadeInUp}
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "visible"}
      viewport={revealViewport}
    >
      {children}
    </motion.div>
  );
}

export function OboyaTerraPageContent({
  blocks,
  exploreHref,
}: {
  blocks: OboyaTerraCardData[];
  exploreHref: string;
}) {
  const t = useTranslations("oboyaTerraPage");
  const challenges = t.raw("challenges") as string[];

  return (
    <div className="bg-oboya-soft-white">
      <SolutionsHero headline={t("heroTitle")} body={t("heroBody")} image={HERO_IMAGE} />

      <section className="mx-auto max-w-[var(--container-max)] px-6 pt-[clamp(2.5rem,5vw,3.5rem)] md:px-10">
        <div className="h-px w-full bg-oboya-green/50" aria-hidden />
        <ul className="mt-6 grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((text) => (
            <li key={text} className="flex items-start gap-2.5">
              <CircleCheck
                aria-hidden="true"
                size={20}
                strokeWidth={1.5}
                className="mt-0.5 shrink-0 text-oboya-green"
              />
              <span className="font-body text-[0.9375rem] leading-snug text-oboya-blue-dark">
                {text}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="terra-explore-title" className="py-[clamp(3.5rem,8vw,6rem)]">
        <Reveal>
          <h2 id="terra-explore-title" className={H2_CLASS}>
            {t("explore.title")}
          </h2>
        </Reveal>
        <ul className="mx-auto mt-[clamp(2rem,5vw,3.5rem)] grid max-w-[var(--container-max)] gap-6 px-6 md:px-10 lg:grid-cols-6">
          {blocks.map((block, i) => {
            const three = i < 3;
            return (
              <li key={block.id} className={three ? "lg:col-span-2" : "lg:col-span-3"}>
                <Reveal className="h-full">
                  <Link
                    href={block.href}
                    className={cn(
                      "group relative block overflow-hidden shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-oboya-green",
                      three ? "aspect-[4/3] sm:aspect-[5/6]" : "aspect-[4/3]"
                    )}
                  >
                    <Image
                      src={block.image}
                      alt=""
                      fill
                      className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
                      sizes={
                        three
                          ? "(min-width: 1280px) 400px, (min-width: 1024px) 33vw, 100vw"
                          : "(min-width: 1280px) 600px, (min-width: 1024px) 50vw, 100vw"
                      }
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-oboya-blue-dark/90 via-oboya-blue-dark/35 to-transparent"
                      aria-hidden
                    />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
                      <h3 className="font-body text-lg font-bold leading-tight">{block.title}</h3>
                      <p className="mt-2 font-body text-sm leading-relaxed text-white/90">
                        {block.description}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
        <div className="mt-10 flex justify-center px-6">
          <Link
            href={exploreHref}
            className="inline-flex items-center rounded-full border border-oboya-green px-7 py-2.5 font-body text-sm font-semibold text-oboya-green transition-colors hover:bg-oboya-green hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-oboya-green"
          >
            {t("explore.cta")}
          </Link>
        </div>
      </section>

      <section aria-labelledby="terra-why-title" className="overflow-x-clip pb-[clamp(3.5rem,8vw,6rem)]">
        <Reveal>
          <h2 id="terra-why-title" className={H2_CLASS}>
            {t("why.title")}
          </h2>
        </Reveal>
        <div className="mx-auto mt-[clamp(2.5rem,6vw,4.5rem)] flex max-w-[var(--container-max)] flex-col gap-[clamp(4rem,9vw,7rem)] px-6 md:px-10">
          {Array.from({ length: WHY_COUNT }, (_, i) => {
            const flip = i % 2 === 1;
            return (
              <Reveal
                key={i}
                className={cn(
                  "relative grid items-center gap-8 md:gap-[8%]",
                  flip ? "md:grid-cols-[1fr_45%]" : "md:grid-cols-[45%_1fr]"
                )}
              >
                <div
                  aria-hidden
                  className={cn(
                    "absolute hidden bg-white md:bottom-[-2.5rem] md:top-10 md:block",
                    flip
                      ? "left-6 right-[calc(50%-50vw)] md:left-[calc(55%+2rem)]"
                      : "left-[calc(50%-50vw)] right-6 md:right-[calc(55%+2rem)]"
                  )}
                />
                <div className={cn("relative aspect-[4/3] w-full", flip && "md:order-2")}>
                  <Image
                    src={WHY_IMAGE}
                    alt={t(`why.items.${i}.imageAlt`)}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1280px) 520px, (min-width: 768px) 45vw, 100vw"
                  />
                </div>
                <div className={cn("relative", flip && "md:order-1")}>
                  <h3 className="font-body text-base font-bold text-oboya-blue-dark">
                    {t(`why.items.${i}.title`)}
                  </h3>
                  <div className="mt-3 h-px w-14 bg-oboya-orange" aria-hidden />
                  <p className="mt-4 max-w-md font-body text-[15px] leading-relaxed text-oboya-blue-dark">
                    {t(`why.items.${i}.body`)}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="terra-cta-title" className="relative overflow-hidden bg-oboya-blue-dark">
        <Image src={CTA_IMAGE} alt="" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-black/50" aria-hidden />
        <Reveal className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-6 py-[clamp(4rem,10vw,7rem)] text-center">
          <h2
            id="terra-cta-title"
            className="font-display text-[clamp(2rem,3.6vw,2.6rem)] font-light leading-[1.15] text-white"
          >
            {t("cta.title")}
          </h2>
          <p className="mt-6 font-body text-sm leading-relaxed text-white/90 md:text-[15px]">
            {t("cta.body")}
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex items-center rounded-full border border-white px-7 py-2.5 font-body text-xs font-medium uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {t("cta.button")}
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
