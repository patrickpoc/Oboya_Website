"use client";

import Image from "next/image";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, useInView } from "framer-motion";
import { Container } from "@/components/ui/container";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { TypewriterText } from "@/components/ui/typewriter-text";
import { homepageImages } from "@/constants/homepage-images";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export function CompanyOverview() {
  const t = useTranslations("companyOverview");
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-10%" });

  const stats = [
    { value: 600, suffix: "+", label: t("statLocations") },
    { value: 80, suffix: "+", label: t("statCountries") },
    { value: 20, suffix: "+", label: t("statExperience") },
  ] as const;

  const headlineSegments = [
    { text: t("headlineGreen"), className: "text-oboya-green" },
    { text: t("headlineWhite"), className: "text-white" },
  ];

  return (
    <section
      ref={sectionRef}
      className="bg-oboya-blue-dark pb-[var(--section-y-sm)] pt-16 md:pt-20"
    >
      <Container>
        <div className="grid items-center gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-8 xl:gap-10">
          <h2 className="font-display text-[clamp(1.375rem,2.2vw,2rem)] leading-[1.25] font-semibold tracking-[-0.02em] lg:col-span-4">
            <TypewriterText
              segments={headlineSegments}
              active={isInView}
              duration={2.5}
            />
          </h2>

          <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] items-center gap-4 sm:gap-6 lg:contents">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[4/5] w-full max-h-[min(18rem,38vh)] overflow-hidden rounded-2xl lg:col-span-3 lg:mx-0 lg:max-h-[min(24rem,46vh)]"
            >
              <Image
                src={homepageImages.companyOverview}
                alt={t("imageAlt")}
                width={1024}
                height={1536}
                className="h-full w-full object-cover"
                sizes="(max-width: 1024px) 40vw, 220px"
                priority
              />
            </motion.div>

            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="flex flex-col lg:col-span-5"
            >
            {stats.map((stat, index) => (
              <motion.li key={stat.label} variants={fadeInUp}>
                <div className="flex items-center justify-between gap-6 py-4 md:py-5">
                  <span className="shrink-0 font-display text-[clamp(2.25rem,4.5vw,3.5rem)] font-bold leading-none tracking-tight text-white">
                    <AnimatedCounter
                      value={stat.value}
                      suffix={stat.suffix}
                      active={isInView}
                      duration={4}
                    />
                  </span>
                  <span className="max-w-[10rem] text-right text-sm leading-snug text-white/75 md:max-w-[12rem]">
                    {stat.label}
                  </span>
                </div>
                {index < stats.length - 1 && (
                  <div className="h-px w-full bg-white/12" aria-hidden="true" />
                )}
              </motion.li>
            ))}
          </motion.ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
