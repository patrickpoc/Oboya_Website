"use client";

import { Container } from "@/components/ui/container";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { TypewriterText } from "@/components/ui/typewriter-text";
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
            text: ` ${pickLocalized(data.headlineWhite, locale)}`,
            className: "text-white",
            breakBefore: false,
          },
        ];

  const stats = data.stats.slice(0, 3);

  return (
    <section className="relative bg-oboya-blue-dark py-14 md:py-16 lg:py-20">
      <Container>
        <h2 className="mx-auto max-w-4xl text-center font-display text-[clamp(1.55rem,3.4vw,2.65rem)] leading-[1.28] font-light tracking-[-0.02em]">
          {animationsEnabled ? (
            <TypewriterText
              segments={headlineSegments}
              active
              duration={3}
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

        <ul className="mt-12 flex flex-col md:mt-14">
          {stats.map((stat, index) => (
            <li key={stat.id}>
              {index === 0 ? (
                <div className="h-px w-full bg-white/25" aria-hidden />
              ) : null}
              <div className="flex items-center justify-between gap-8 py-5 md:gap-12 md:py-6 lg:py-7">
                <span className="shrink-0 font-display text-[clamp(3rem,8vw,6.5rem)] font-thin leading-none tracking-tight text-white">
                  {animationsEnabled ? (
                    <AnimatedCounter
                      value={stat.value}
                      suffix={stat.suffix}
                      active
                      duration={2.2}
                    />
                  ) : (
                    <>
                      {stat.value}
                      {stat.suffix}
                    </>
                  )}
                </span>
                <span className="max-w-[12rem] text-right font-body text-base font-semibold leading-snug text-white sm:max-w-[16rem] sm:text-lg md:max-w-[20rem] md:text-xl lg:max-w-[24rem] lg:text-2xl">
                  {pickLocalized(stat.label, locale)}
                </span>
              </div>
              <div className="h-px w-full bg-white/25" aria-hidden />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
