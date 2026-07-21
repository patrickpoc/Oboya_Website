"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { fadeInUp } from "@/lib/animations";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";
import type { CmsCaseStudy } from "@/lib/cms/repositories/case-studies-repository";

interface CaseStudiesPageContentProps {
  studies: CmsCaseStudy[];
  locale: string;
}

const FEATURED_COUNT = 4;

function coverSrc(url: string, wide = false) {
  if (!url) return "";
  if (url.includes("images.unsplash.com")) {
    const base = url.split("?")[0];
    return wide
      ? `${base}?auto=format&fit=crop&w=1400&h=900&q=75`
      : `${base}?auto=format&fit=crop&w=900&h=700&q=75`;
  }
  return url;
}

export function CaseStudiesPageContent({
  studies,
  locale,
}: CaseStudiesPageContentProps) {
  const t = useTranslations("caseStudies");
  const [country, setCountry] = useState<string>("all");
  const carouselRef = useRef<HTMLDivElement>(null);

  const published = useMemo(
    () => studies.filter((s) => s.status === "published"),
    [studies]
  );

  const featured = published.slice(0, FEATURED_COUNT);

  const countries = useMemo(() => {
    const set = new Set(published.map((s) => s.country).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [published]);

  const carouselItems = useMemo(() => {
    if (country === "all") return published;
    return published.filter((s) => s.country === country);
  }, [published, country]);

  const scrollCarousel = (dir: -1 | 1) => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-carousel-card]");
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.75;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <>
      <section className="bg-white pt-[clamp(3.5rem,8vw,5.5rem)] pb-10 md:pb-12">
        <Container>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="max-w-3xl"
          >
            <p className="font-body text-[0.8125rem] font-medium tracking-[0.04em] text-oboya-green">
              {t("eyebrow")}
            </p>
            <div
              className="mt-2.5 h-px w-full max-w-xs bg-oboya-green/55"
              aria-hidden
            />
            <h1 className="mt-6 font-display text-[clamp(1.75rem,3.4vw,2.75rem)] font-semibold leading-[1.2] tracking-[-0.02em] text-oboya-blue-dark text-pretty">
              {t("hubTitle")}
            </h1>
            <p className="mt-4 max-w-2xl font-body text-[0.9375rem] leading-relaxed text-oboya-blue-dark/55 md:text-base">
              {t("hubDescription")}
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Sticky stair scroll — one panel pinned; next slides over inverted */}
      {featured.length > 0 && (
        <section className="relative w-full" aria-label={t("showcaseTitle")}>
          {featured.map((study, index) => {
            const imageRight = index % 2 === 0;
            return (
              <article
                key={study.id}
                style={{ zIndex: 10 + index }}
                className={cn(
                  "grid w-full items-stretch lg:grid-cols-2",
                  "lg:sticky lg:top-[calc(5rem+5vh)] lg:h-[calc(100svh-5rem-10vh)]",
                  index % 2 === 0 ? "bg-oboya-soft-white" : "bg-white"
                )}
              >
                <div
                  className={cn(
                    "flex flex-col justify-center px-[var(--container-padding)] py-10 sm:py-12 lg:py-0",
                    imageRight
                      ? "order-2 lg:order-1 lg:pl-[max(var(--container-padding),calc((100vw-var(--container-max))/2+var(--container-padding)))] lg:pr-12 xl:pr-16"
                      : "order-2 lg:order-2 lg:pr-[max(var(--container-padding),calc((100vw-var(--container-max))/2+var(--container-padding)))] lg:pl-12 xl:pl-16"
                  )}
                >
                  <div className="max-w-md">
                    <p className="text-xs font-medium uppercase tracking-wide text-oboya-green">
                      {study.industry} · {study.country}
                    </p>
                    <p className="mt-3 font-display text-[clamp(1.35rem,2.4vw,2rem)] font-semibold tracking-[-0.02em] text-oboya-blue-dark">
                      {pickLocalized(study.metric, locale)}
                    </p>
                    <h2 className="mt-2.5 font-display text-[clamp(1.1rem,1.8vw,1.35rem)] font-semibold leading-snug text-oboya-blue-dark">
                      {pickLocalized(study.title, locale)}
                    </h2>
                    <p className="mt-2.5 font-body text-sm leading-relaxed text-oboya-blue-dark/55">
                      {pickLocalized(study.excerpt, locale)}
                    </p>
                    <Link
                      href={`/case-studies/${study.slug}`}
                      className={buttonVariants({
                        size: "cta",
                        variant: "outline",
                        className:
                          "mt-6 w-fit border-oboya-green text-oboya-blue-dark hover:bg-oboya-green hover:text-white",
                      })}
                    >
                      {t("readMore")}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>

                <Link
                  href={`/case-studies/${study.slug}`}
                  className={cn(
                    "relative block aspect-[16/11] overflow-hidden bg-oboya-blue-dark lg:aspect-auto lg:h-full lg:min-h-0",
                    imageRight ? "order-1 lg:order-2" : "order-1 lg:order-1"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverSrc(study.coverImage, true)}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                  />
                </Link>
              </article>
            );
          })}
        </section>
      )}

      {/* Country filter + carousel */}
      <section className="bg-oboya-soft-white py-[clamp(3.5rem,8vw,6rem)]">
        <Container>
          <div className="mb-8 flex flex-col gap-6 md:mb-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <p className="font-body text-[0.8125rem] font-medium tracking-[0.04em] text-oboya-green">
                {t("carouselEyebrow")}
              </p>
              <h2 className="mt-2 font-display text-[clamp(1.35rem,2.5vw,1.85rem)] font-semibold tracking-tight text-oboya-blue-dark">
                {t("byCountryTitle")}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollCarousel(-1)}
                aria-label={t("previous")}
                className="flex size-10 items-center justify-center border border-oboya-blue-dark/20 bg-white text-oboya-blue-dark transition-colors hover:border-oboya-blue-dark hover:bg-oboya-blue-dark hover:text-white"
              >
                <ArrowLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel(1)}
                aria-label={t("next")}
                className="flex size-10 items-center justify-center border border-oboya-blue-dark/20 bg-white text-oboya-blue-dark transition-colors hover:border-oboya-blue-dark hover:bg-oboya-blue-dark hover:text-white"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCountry("all")}
              className={cn(
                "border px-4 py-1.5 text-xs font-medium transition-colors",
                country === "all"
                  ? "border-oboya-blue-dark bg-oboya-blue-dark text-white"
                  : "border-border bg-white text-oboya-blue-dark hover:border-oboya-blue-dark/40"
              )}
            >
              {t("filterAllCountries")}
            </button>
            {countries.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setCountry(name)}
                className={cn(
                  "border px-4 py-1.5 text-xs font-medium transition-colors",
                  country === name
                    ? "border-oboya-blue-dark bg-oboya-blue-dark text-white"
                    : "border-border bg-white text-oboya-blue-dark hover:border-oboya-blue-dark/40"
                )}
              >
                {name}
              </button>
            ))}
          </div>

          {carouselItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("emptyFilter")}</p>
          ) : (
            <div
              ref={carouselRef}
              className="-mx-[var(--container-padding)] flex snap-x snap-mandatory gap-6 overflow-x-auto px-[var(--container-padding)] pb-2 scrollbar-none"
              style={{ scrollbarWidth: "none" }}
            >
              {carouselItems.map((study) => (
                <article
                  key={study.id}
                  data-carousel-card
                  className="w-[min(85vw,20rem)] shrink-0 snap-start sm:w-[22rem]"
                >
                  <Link
                    href={`/case-studies/${study.slug}`}
                    className="group block bg-white"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-oboya-blue-dark/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverSrc(study.coverImage)}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-oboya-green">
                        {study.industry} · {study.country}
                      </p>
                      <p className="mt-2 font-display text-lg font-semibold tracking-tight text-oboya-blue-dark">
                        {pickLocalized(study.metric, locale)}
                      </p>
                      <h3 className="mt-1.5 font-display text-base font-semibold leading-snug text-oboya-blue-dark group-hover:text-oboya-green">
                        {pickLocalized(study.title, locale)}
                      </h3>
                      <p className="mt-2 line-clamp-2 font-body text-sm leading-relaxed text-oboya-blue-dark/55">
                        {pickLocalized(study.excerpt, locale)}
                      </p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </Container>
      </section>

      <section className="bg-oboya-blue-dark py-[clamp(4rem,9vw,7rem)]">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-tight text-white text-balance">
              {t("ctaTitle")}
            </h2>
            <p className="mt-4 font-body text-sm leading-relaxed text-white/65 md:text-base">
              {t("ctaDescription")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/contact"
                className={buttonVariants({
                  size: "cta",
                  className: "bg-oboya-green text-white hover:bg-oboya-green/90",
                })}
              >
                {t("ctaPrimary")}
                <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href="/shop?quote=open"
                className={buttonVariants({
                  size: "cta",
                  variant: "outline",
                  className:
                    "border-white/40 bg-transparent text-white hover:bg-white/10",
                })}
              >
                {t("ctaSecondary")}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
