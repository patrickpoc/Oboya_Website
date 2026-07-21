"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Container } from "@/components/ui/container";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { TypewriterText } from "@/components/ui/typewriter-text";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { pickLocalized } from "@/lib/cms/utils";

interface CompanyOverviewProps {
  data: HomepageSettings["companyOverview"];
  locale: string;
  animationsEnabled?: boolean;
}

export function CompanyOverview({
  data,
  locale,
  animationsEnabled = true,
}: CompanyOverviewProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-12%" });
  const motionActive = animationsEnabled && isInView;

  const headlineSegments =
    data.segments?.length > 0
      ? data.segments.map((segment, index) => ({
          text: pickLocalized(segment.text, locale),
          className:
            segment.tone === "green" ? "text-oboya-green" : "text-white",
          breakBefore: segment.breakBefore ?? index > 0,
        }))
      : [
          {
            text: pickLocalized(data.headlineGreen, locale),
            className: "text-oboya-green",
            breakBefore: false,
          },
          {
            text: pickLocalized(data.headlineWhite, locale),
            className: "text-white",
            breakBefore: true,
          },
        ];

  return (
    <section
      ref={sectionRef}
      className="relative bg-oboya-blue-dark pb-16 pt-8 md:pb-20 md:pt-10"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-white/15" aria-hidden />

      <Container>
        <h2 className="mb-10 max-w-4xl font-display text-[clamp(1.75rem,4.2vw,3.25rem)] leading-[1.25] font-light tracking-[-0.02em] md:mb-14">
          {animationsEnabled ? (
            <TypewriterText
              segments={headlineSegments}
              active={motionActive}
              duration={3.2}
            />
          ) : (
            headlineSegments.map((segment, index) => (
              <span key={index}>
                {segment.breakBefore ? <br /> : null}
                <span className={segment.className}>{segment.text}</span>
              </span>
            ))
          )}
        </h2>

        <div className="grid items-center gap-6 md:gap-8 lg:grid-cols-12 lg:gap-10">
          <motion.div
            initial={animationsEnabled ? { opacity: 0, y: 28 } : false}
            animate={motionActive ? { opacity: 1, y: 0 } : animationsEnabled ? {} : { opacity: 1, y: 0 }}
            transition={
              animationsEnabled
                ? { duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0 }
            }
            className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-sm sm:max-w-md lg:col-span-4 lg:mx-0 lg:max-w-none"
          >
            <Image
              src={data.image}
              alt={pickLocalized(data.imageAlt, locale)}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 90vw, 280px"
              priority
            />
          </motion.div>

          <motion.ul
            variants={staggerContainer}
            initial={animationsEnabled ? "hidden" : false}
            animate={motionActive ? "visible" : animationsEnabled ? "hidden" : false}
            className="flex flex-col lg:col-span-8"
          >
            {data.stats.map((stat, index) => (
              <motion.li key={stat.id} variants={animationsEnabled ? fadeInUp : undefined}>
                {index === 0 && (
                  <div className="h-px w-full bg-white/15" aria-hidden />
                )}
                <div className="flex items-center justify-between gap-5 py-4 md:gap-8 md:py-5">
                  <span className="shrink-0 font-display text-[clamp(2.75rem,7vw,6.375rem)] font-thin leading-none tracking-tight text-white">
                    {animationsEnabled ? (
                      <AnimatedCounter
                        value={stat.value}
                        suffix={stat.suffix}
                        active={motionActive}
                        duration={3.8}
                      />
                    ) : (
                      <>
                        {stat.value}
                        {stat.suffix}
                      </>
                    )}
                  </span>
                  <span className="max-w-[10rem] text-right font-body text-[1.125rem] font-medium leading-snug text-white md:max-w-[13rem]">
                    {pickLocalized(stat.label, locale)}
                  </span>
                </div>
                {index < data.stats.length - 1 && (
                  <div className="h-px w-full bg-white/15" aria-hidden />
                )}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </Container>
    </section>
  );
}
