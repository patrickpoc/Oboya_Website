"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import type {
  SolutionsPageBanner,
  SolutionsPageCrop,
  SolutionsPageSettings,
} from "@/lib/cms/repositories/solutions-page-repository";
import { cropFilterFromAreaParam } from "@/lib/solutions/solutions-data";
import type { SolutionsCropFilterId } from "@/lib/solutions/types";
import {
  buildShopHrefForSolution,
  mergeShopFilterTargets,
} from "@/lib/solutions/solutions-shop-linking";
import { cn } from "@/lib/utils";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/60 focus-visible:ring-offset-2";

interface SolutionsExplorerProps {
  settings: SolutionsPageSettings;
}

export function SolutionsExplorer({ settings }: SolutionsExplorerProps) {
  const t = useTranslations("solutionsPage.explorer");
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const crops = settings.crops;
  const banners = settings.banners;

  const [activeFilter, setActiveFilter] =
    useState<SolutionsCropFilterId>(() => {
      return cropFilterFromAreaParam(searchParams.get("area")) ?? "flowers";
    });

  useEffect(() => {
    const mapped = cropFilterFromAreaParam(searchParams.get("area"));
    if (mapped == null) return;
    startTransition(() => setActiveFilter(mapped));
  }, [searchParams, startTransition]);

  const activeCrop: SolutionsPageCrop | undefined = useMemo(
    () => crops.find((crop) => crop.id === activeFilter) ?? crops[0],
    [activeFilter, crops]
  );

  const heading =
    activeFilter === "all"
      ? t("headingAll")
      : t("headingFor", {
          sector: pickLocalized(activeCrop?.sectorTitle ?? { en: "" }, locale),
        });

  const description = pickLocalized(
    activeCrop?.description ?? { en: "" },
    locale
  );

  return (
    <section
      id="solutions-explorer"
      aria-labelledby="solutions-explorer-heading"
      className="bg-white py-[var(--section-y-sm)]"
    >
      <Container>
        <nav
          aria-label={t("navLabel")}
          className="flex flex-wrap gap-2"
        >
          {crops.map((filter) => {
            const isActive = filter.id === activeFilter;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() =>
                  startTransition(() =>
                    setActiveFilter(filter.id as SolutionsCropFilterId)
                  )
                }
                aria-pressed={isActive}
                className={cn(
                  "rounded-full px-3.5 py-1.5 font-body text-[0.8125rem] font-medium transition-colors md:text-sm",
                  focusRing,
                  isActive
                    ? "bg-oboya-green text-white"
                    : "bg-oboya-soft-white text-oboya-green hover:bg-oboya-green/15"
                )}
              >
                {pickLocalized(filter.label, locale)}
              </button>
            );
          })}
        </nav>

        <motion.div
          key={activeFilter}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.3 }}
          className="mt-6 grid gap-4 md:mt-7 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-end md:gap-8 lg:gap-12"
        >
          <h1
            id="solutions-explorer-heading"
            className="font-display text-[clamp(1.55rem,3.2vw,2.35rem)] font-light leading-[1.12] tracking-[-0.02em] text-oboya-blue-dark text-balance"
          >
            {heading}
          </h1>
          <p className="max-w-lg font-body text-[0.9rem] leading-[1.6] text-oboya-blue-dark/65 md:justify-self-end md:text-[0.975rem] md:leading-[1.65]">
            {description}
          </p>
        </motion.div>

        <motion.div
          key={`grid-${activeFilter}`}
          initial={reduceMotion ? false : "hidden"}
          animate={reduceMotion ? undefined : "visible"}
          variants={reduceMotion ? undefined : staggerContainer}
          className="mt-7 grid gap-x-4 gap-y-7 sm:grid-cols-2 md:mt-8 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-5 xl:gap-y-8"
        >
          {banners.map((card: SolutionsPageBanner) => {
            const href = buildShopHrefForSolution(
              mergeShopFilterTargets(activeCrop?.shop, card.shop)
            );
            const tags = card.tags
              .map((tag) => pickLocalized(tag, locale))
              .filter(Boolean)
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
                  <div className="relative aspect-[5/4] overflow-hidden bg-oboya-soft-white sm:aspect-[4/3]">
                    <Image
                      src={card.image}
                      alt={pickLocalized(card.title, locale)}
                      fill
                      className={cn(
                        "object-cover",
                        !reduceMotion &&
                          "motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.04]"
                      )}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                  </div>
                  <h2 className="mt-2.5 font-display text-[0.975rem] font-semibold leading-snug text-oboya-blue-dark md:mt-3 md:text-[1.05rem]">
                    {pickLocalized(card.title, locale)}
                  </h2>
                  {tags ? (
                    <p className="mt-1 font-body text-[0.8125rem] leading-relaxed text-oboya-blue-dark/55">
                      {tags}
                    </p>
                  ) : null}
                </Link>
              </motion.article>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
