"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import { cn } from "@/lib/utils";

interface AboutCorporateCultureProps {
  data: AboutPageSettings["culture"];
  locale: string;
}

/** Split “What Makes Oboya / Horticulture Different” style titles for the two-tone heading. */
function splitCultureTitle(title: string): { lead: string; rest: string } | null {
  const trimmed = title.trim();
  if (!trimmed) return null;

  const known: Array<[RegExp, string, string]> = [
    [
      /^What Makes Oboya\s+Horticulture Different$/i,
      "What Makes Oboya",
      "Horticulture Different",
    ],
    [
      /^O que torna a Oboya\s+Horticulture diferente$/i,
      "O que torna a Oboya",
      "Horticulture diferente",
    ],
    [
      /^Qué hace diferente a Oboya\s+Horticulture$/i,
      "Qué hace diferente a Oboya",
      "Horticulture",
    ],
  ];

  for (const [pattern, lead, rest] of known) {
    if (pattern.test(trimmed)) return { lead, rest };
  }

  const match = trimmed.match(/^(.*?Oboya)\s+(.+)$/i);
  if (match?.[1] && match[2]) {
    return { lead: match[1].trim(), rest: match[2].trim() };
  }

  return null;
}

export function AboutCorporateCulture({
  data,
  locale,
}: AboutCorporateCultureProps) {
  const reduceMotion = useReducedMotion();
  const title = data.title
    ? pickLocalized(data.title, locale).trim()
    : pickLocalized(data.eyebrow, locale).trim();
  const titleParts = title ? splitCultureTitle(title) : null;

  if (!title && data.items.length === 0) return null;

  const featured =
    data.items.find((item) => item.imageSide === "right" && item.image) ??
    data.items.find((item) => item.image) ??
    null;
  const featuredSrc = featured?.image || "/assets/about/institutional.png";
  const featuredAlt = featured
    ? pickLocalized(featured.imageAlt, locale)
    : title || "Oboya Horticulture";

  const reveal = reduceMotion
    ? undefined
    : ({
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, margin: "-80px" },
      } as const);

  return (
    <section
      className="overflow-x-clip border-t border-oboya-green/35 bg-oboya-blue-dark"
      aria-labelledby={title ? "about-culture-heading" : undefined}
    >
      <div className="grid lg:grid-cols-12 lg:items-stretch">
        <motion.div
          {...(reveal ?? {})}
          initial={reveal ? "hidden" : false}
          variants={reduceMotion ? undefined : staggerContainer}
          className={cn(
            "flex flex-col justify-center",
            "px-[var(--container-padding)] py-[clamp(3.5rem,8vw,6.5rem)]",
            "lg:col-span-7 xl:col-span-8",
            "lg:pl-[calc(max(0px,(100vw-var(--container-max))/2)+var(--container-padding))]",
            "lg:pr-10 xl:pr-16"
          )}
        >
          {title ? (
            <motion.h2
              id="about-culture-heading"
              variants={reduceMotion ? undefined : fadeInUp}
              className="max-w-xl font-display text-[clamp(1.85rem,3.6vw,3.15rem)] font-light leading-[1.08] tracking-[-0.02em] text-balance"
            >
              {titleParts ? (
                <>
                  <span className="text-oboya-green">{titleParts.lead}</span>
                  <br />
                  <span className="text-white">{titleParts.rest}</span>
                </>
              ) : (
                <span className="text-white">{title}</span>
              )}
            </motion.h2>
          ) : null}

          {data.items.length > 0 ? (
            <ul
              className={cn(
                "mt-10 grid list-none gap-x-8 gap-y-10 sm:mt-12 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-12 md:mt-14 lg:gap-x-12 lg:gap-y-14",
                !title && "mt-0"
              )}
            >
              {data.items.map((item) => {
                const itemTitle = pickLocalized(item.title, locale);
                const description = pickLocalized(item.description, locale);
                const ctaLabel =
                  item.ctaLabel != null
                    ? pickLocalized(item.ctaLabel, locale)
                    : "Learn more";
                const href = item.ctaHref || "/solutions";

                return (
                  <motion.li
                    key={item.id}
                    variants={reduceMotion ? undefined : fadeInUp}
                    className="flex min-w-0 flex-col"
                  >
                    <h3 className="font-display text-[clamp(1.05rem,1.6vw,1.25rem)] font-semibold leading-snug tracking-[-0.015em] text-white text-balance">
                      {itemTitle}
                    </h3>
                    <p className="mt-3 flex-1 font-body text-[0.9375rem] leading-[1.6] text-white/88 md:text-base md:leading-[1.65]">
                      {description}
                    </p>
                    <Link
                      href={href}
                      className="group mt-4 inline-flex w-fit items-center gap-1.5 font-body text-[0.9375rem] font-medium text-white underline decoration-1 decoration-white/70 underline-offset-[0.35em] transition-colors hover:text-oboya-green hover:decoration-oboya-green"
                    >
                      {ctaLabel}
                      <ArrowRight
                        className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          ) : null}
        </motion.div>

        <motion.div
          {...(reveal ?? {})}
          initial={reveal ? "hidden" : false}
          variants={reduceMotion ? undefined : fadeInUp}
          className="relative min-h-[16rem] sm:min-h-[20rem] lg:col-span-5 xl:col-span-4 lg:min-h-full"
        >
          <Image
            src={featuredSrc}
            alt={featuredAlt}
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 40vw"
            priority={false}
          />
        </motion.div>
      </div>
    </section>
  );
}
