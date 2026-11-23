"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SolutionsHero } from "@/components/solutions/SolutionsHero";
import { fadeInUp, revealViewport } from "@/lib/animations";
import { cn } from "@/lib/utils";

const HERO_IMAGE = "/assets/homepage/greenhouse-technology.webp";
const COMMITMENT_IMAGE = "/assets/homepage/solutions-integrated.jpg";

const VALUE_IMAGES = [
  "/assets/homepage/wheel-propagation.jpg",
  "/assets/solutions/flowers/automation.jpg",
  "/assets/homepage/wheel-packaging.jpg",
];

/** Edit images / links here when replacing the featured cards. */
const FEATURED = [
  { image: "/assets/homepage/wheel-growing.jpg", href: "/shop" },
  { image: "/assets/homepage/wheel-pos.jpg", href: "/shop" },
  { image: "/assets/homepage/wheel-harvest.jpg", href: "/solutions" },
] as const;

const H2_CLASS =
  "text-center font-display text-[clamp(2.2rem,4vw,3rem)] font-light leading-[1.1] text-oboya-green text-balance";

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

export function InnovationPageContent() {
  const t = useTranslations("innovationPage");

  return (
    <>
      <SolutionsHero headline={t("heroTitle")} body={t("heroBody")} image={HERO_IMAGE} />

      <section className="overflow-x-clip bg-white py-[clamp(3.5rem,8vw,6rem)]">
        <Reveal>
          <h2 className={H2_CLASS}>{t("value.title")}</h2>
        </Reveal>
        <div className="mx-auto mt-[clamp(2.5rem,6vw,4.5rem)] flex max-w-[var(--container-max)] flex-col gap-[clamp(4rem,9vw,7rem)] px-6 md:px-10">
          {VALUE_IMAGES.map((src, i) => {
            const flip = i === 1;
            return (
              <Reveal
                key={src}
                className={cn(
                  "relative grid items-center gap-8 md:gap-[8%]",
                  flip ? "md:grid-cols-[1fr_45%]" : "md:grid-cols-[45%_1fr]"
                )}
              >
                <div
                  aria-hidden
                  className={cn(
                    "absolute hidden bg-oboya-soft-white md:bottom-[-2.5rem] md:top-10 md:block",
                    flip
                      ? "left-6 right-[calc(50%-50vw)] md:left-[calc(55%+2rem)]"
                      : "left-[calc(50%-50vw)] right-6 md:right-[calc(55%+2rem)]"
                  )}
                />
                <div className={cn("relative aspect-[4/3] w-full", flip && "md:order-2")}>
                  <Image
                    src={src}
                    alt={t(`value.items.${i}.imageAlt`)}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1280px) 520px, (min-width: 768px) 45vw, 100vw"
                  />
                </div>
                <div className={cn("relative", flip && "md:order-1")}>
                  <h3 className="font-body text-base font-semibold text-oboya-blue-dark">
                    {t(`value.items.${i}.title`)}
                  </h3>
                  <div className="mt-3 h-px w-14 bg-oboya-orange" aria-hidden />
                  <p className="mt-4 max-w-md font-body text-[15px] leading-relaxed text-oboya-blue-dark">
                    {t(`value.items.${i}.body`)}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section
        id="featured-innovations"
        aria-labelledby="featured-innovations-title"
        className="scroll-mt-20 bg-white pb-[clamp(3.5rem,8vw,6rem)] pt-8"
      >
        <Reveal>
          <h2 id="featured-innovations-title" className={H2_CLASS}>
            {t("featured.title")}
          </h2>
        </Reveal>
        <ul className="mx-auto mt-[clamp(2.5rem,6vw,4rem)] grid max-w-[var(--container-max)] gap-10 px-6 sm:grid-cols-2 md:px-10 lg:grid-cols-3 lg:gap-12">
          {FEATURED.map((item, i) => (
            <li key={i}>
              <Reveal className="flex h-full flex-col">
                <div className="relative aspect-[3/2] w-full">
                  <Image
                    src={item.image}
                    alt={t(`featured.items.${i}.imageAlt`)}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw"
                  />
                </div>
                <h3 className="mt-5 font-body text-base font-bold text-oboya-blue-dark">
                  {t(`featured.items.${i}.title`)}
                </h3>
                <p className="mt-2 flex-1 font-body text-sm leading-relaxed text-oboya-blue-dark">
                  {t(`featured.items.${i}.body`)}
                </p>
                <Link
                  href={item.href}
                  className="mt-4 inline-flex items-center gap-1.5 self-start font-body text-sm font-medium text-oboya-green underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-oboya-green"
                >
                  {t("featured.learnMore")}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="commitment-title"
        className="relative overflow-hidden bg-oboya-blue-dark"
      >
        <Image
          src={COMMITMENT_IMAGE}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/50" aria-hidden />
        <Reveal className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-6 py-[clamp(4rem,10vw,7rem)] text-center">
          <h2
            id="commitment-title"
            className="font-display text-[clamp(2rem,3.6vw,2.6rem)] font-light leading-[1.15] text-white"
          >
            {t("commitment.title")}
          </h2>
          <p className="mt-6 font-body text-sm leading-relaxed text-white/90 md:text-[15px]">
            {t("commitment.body")}
          </p>
          <a
            href="#featured-innovations"
            className="mt-8 inline-flex items-center rounded-full border border-white px-7 py-2.5 font-body text-xs font-medium uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {t("commitment.cta")}
          </a>
        </Reveal>
      </section>
    </>
  );
}
