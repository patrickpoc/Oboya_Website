"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { fadeInUp } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import { cn } from "@/lib/utils";

interface AboutCorporateCultureProps {
  data: AboutPageSettings["culture"];
  locale: string;
}

/** Align inset edge with Container content; opposite side bleeds to viewport. */
const INSET =
  "calc(max(0px, (100vw - var(--container-max)) / 2) + var(--container-padding))";

/** Shared CTA chrome so every card button shares the same footprint. */
const CTA_CLASS = cn(
  buttonVariants({ size: "cta" }),
  "min-w-[11.5rem] justify-center border border-white bg-transparent text-center text-white",
  "hover:bg-white/10 hover:text-white",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
  "sm:min-w-[13rem]"
);

export function AboutCorporateCulture({
  data,
  locale,
}: AboutCorporateCultureProps) {
  const reduceMotion = useReducedMotion();
  const title = data.title
    ? pickLocalized(data.title, locale).trim()
    : pickLocalized(data.eyebrow, locale).trim();

  if (!title && data.items.length === 0) return null;

  const reveal = reduceMotion
    ? undefined
    : ({
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, margin: "-80px" },
      } as const);

  return (
    <section className="overflow-x-clip border-t border-oboya-green/35 bg-oboya-soft-white py-[clamp(4.5rem,10vw,8rem)]">
      {title ? (
        <Container className="mb-10 md:mb-14">
          <motion.div
            {...(reveal ?? {})}
            initial={reveal ? "hidden" : false}
            variants={reduceMotion ? undefined : fadeInUp}
            className="mx-auto max-w-4xl text-center"
          >
            <h2 className="font-display text-[clamp(1.75rem,3.2vw,2.75rem)] font-semibold tracking-[-0.02em] text-oboya-blue-dark text-balance">
              {title}
            </h2>
          </motion.div>
        </Container>
      ) : null}

      <ul className="flex list-none flex-col gap-8 md:gap-10 lg:gap-12">
        {data.items.map((item, index) => {
          const itemTitle = pickLocalized(item.title, locale);
          const description = pickLocalized(item.description, locale);
          const ctaLabel =
            item.ctaLabel != null
              ? pickLocalized(item.ctaLabel, locale)
              : "Learn more";
          const href = item.ctaHref || "/solutions";
          const alt = pickLocalized(item.imageAlt, locale);
          const bleedLeft = item.imageSide === "left";

          return (
            <motion.li
              key={item.id}
              {...(reveal ?? {})}
              initial={reveal ? "hidden" : false}
              variants={reduceMotion ? undefined : fadeInUp}
              transition={
                reduceMotion
                  ? undefined
                  : { delay: Math.min(index * 0.05, 0.2) }
              }
              className={cn(
                "w-full",
                bleedLeft ? "pr-0" : "pl-0"
              )}
              style={
                bleedLeft
                  ? { paddingRight: INSET }
                  : { paddingLeft: INSET }
              }
            >
              <article
                className={cn(
                  "relative overflow-hidden",
                  "min-h-[min(52vw,17rem)] md:min-h-[19rem] lg:min-h-[21rem]"
                )}
              >
                <Image
                  src={item.image}
                  alt={alt}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 90vw"
                />
                <div className="absolute inset-0 bg-black/50" aria-hidden />

                <div
                  className={cn(
                    "relative z-10 flex min-h-[inherit] items-center py-10 md:py-12",
                    bleedLeft
                      ? "justify-end pl-8 pr-[var(--container-padding)] sm:pl-12 md:pl-16"
                      : "justify-start pr-8 pl-[var(--container-padding)] sm:pr-12 md:pr-16"
                  )}
                >
                  <div
                    className={cn(
                      "flex w-full max-w-xl flex-col gap-5 md:max-w-2xl md:gap-6",
                      bleedLeft ? "items-end text-right" : "items-start text-left"
                    )}
                  >
                    <div className="min-w-0 w-full">
                      <h3 className="font-display text-[clamp(1.5rem,2.8vw,2.125rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-white text-balance">
                        {itemTitle}
                      </h3>
                      <p
                        className={cn(
                          "mt-3 font-body text-[clamp(0.95rem,1.4vw,1.125rem)] font-normal leading-[1.55] text-white/92 md:mt-4 md:leading-[1.6]",
                          bleedLeft ? "ml-auto max-w-lg" : "max-w-lg"
                        )}
                      >
                        {description}
                      </p>
                    </div>

                    <Link href={href} className={cn(CTA_CLASS, "shrink-0")}>
                      {ctaLabel}
                    </Link>
                  </div>
                </div>
              </article>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
