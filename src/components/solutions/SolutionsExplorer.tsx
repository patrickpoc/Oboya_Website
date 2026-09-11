"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { fadeInUp, revealViewport, staggerContainer } from "@/lib/animations";
import {
  cropFilterFromAreaParam,
  SOLUTION_CROP_FILTERS,
  SOLUTION_STAGE_CARDS,
} from "@/lib/solutions/solutions-data";
import type { SolutionsCropFilterId } from "@/lib/solutions/types";
import { buildShopHrefForSolution } from "@/lib/solutions/solutions-shop-linking";
import { cn } from "@/lib/utils";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/60 focus-visible:ring-offset-2";

export function SolutionsExplorer() {
  const t = useTranslations("solutionsPage.explorer");
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [activeFilter, setActiveFilter] =
    useState<SolutionsCropFilterId>("flowers");

  useEffect(() => {
    const mapped = cropFilterFromAreaParam(searchParams.get("area"));
    if (!mapped) return;
    startTransition(() => setActiveFilter(mapped));
  }, [searchParams, startTransition]);

  const activeMeta = useMemo(
    () => SOLUTION_CROP_FILTERS.find((f) => f.id === activeFilter)!,
    [activeFilter]
  );

  const heading =
    activeFilter === "all"
      ? t("headingAll")
      : t("headingFor", { sector: t(`areas.${activeMeta.areaKey}.title`) });

  const description =
    activeFilter === "all"
      ? t("description")
      : t(`areas.${activeMeta.areaKey}.description`);

  return (
    <section
      id="solutions-explorer"
      aria-labelledby="solutions-explorer-heading"
      className="bg-white py-[var(--section-y)]"
    >
      <Container>
        <nav
          aria-label={t("navLabel")}
          className="flex flex-wrap gap-2.5"
        >
          {SOLUTION_CROP_FILTERS.map((filter) => {
            const isActive = filter.id === activeFilter;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => startTransition(() => setActiveFilter(filter.id))}
                aria-pressed={isActive}
                className={cn(
                  "rounded-full px-4 py-2 font-body text-sm font-medium transition-colors",
                  focusRing,
                  isActive
                    ? "bg-oboya-green text-white"
                    : "bg-oboya-soft-white text-oboya-green hover:bg-oboya-green/15"
                )}
              >
                {t(`filters.${filter.labelKey}`)}
              </button>
            );
          })}
        </nav>

        <motion.div
          key={activeFilter}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.35 }}
          className="mt-8 grid gap-6 md:mt-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-end md:gap-10 lg:gap-16"
        >
          <h1
            id="solutions-explorer-heading"
            className="font-display text-[clamp(1.85rem,4vw,3rem)] font-light leading-[1.12] tracking-[-0.02em] text-oboya-blue-dark text-balance"
          >
            {heading}
          </h1>
          <p className="max-w-xl font-body text-[0.975rem] leading-[1.65] text-oboya-blue-dark/65 md:justify-self-end md:text-[1.05rem] md:leading-[1.7]">
            {description}
          </p>
        </motion.div>

        <motion.div
          key={`grid-${activeFilter}`}
          initial={reduceMotion ? false : "hidden"}
          animate={reduceMotion ? undefined : "visible"}
          variants={reduceMotion ? undefined : staggerContainer}
          className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12"
        >
          {SOLUTION_STAGE_CARDS.map((card) => {
            const href = buildShopHrefForSolution({
              ...card.shop,
              ...activeMeta.shop,
              q: [activeMeta.shop.q, card.shop.q].filter(Boolean).join(" ").trim() || undefined,
            });
            const tags = card.tagKeys
              .map((key) => t(`items.${key}`))
              .join(", ");

            return (
              <motion.article key={card.id} variants={fadeInUp}>
                <Link
                  href={href}
                  className={cn(
                    "group block rounded-sm transition-opacity",
                    focusRing
                  )}
                >
                  <div className="relative aspect-square overflow-hidden bg-oboya-soft-white">
                    <Image
                      src={card.image}
                      alt={t(`stages.${card.titleKey}.title`)}
                      fill
                      className={cn(
                        "object-cover",
                        !reduceMotion &&
                          "motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.04]"
                      )}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <h2 className="mt-4 font-display text-[1.05rem] font-semibold leading-snug text-oboya-blue-dark md:text-[1.15rem]">
                    {t(`stages.${card.titleKey}.title`)}
                  </h2>
                  <p className="mt-1.5 font-body text-sm leading-relaxed text-oboya-blue-dark/55">
                    {tags}
                  </p>
                </Link>
              </motion.article>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
