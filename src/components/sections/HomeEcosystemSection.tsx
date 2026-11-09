"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { HomeEcosystemRail } from "@/components/sections/HomeEcosystemRail";
import { HomeEcosystemStage } from "@/components/sections/HomeEcosystemStage";
import {
  useEcosystemSequence,
  useEcosystemStatic,
} from "@/components/sections/useEcosystemSequence";
import { pickLocalized } from "@/lib/cms/utils";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";

/** Ecosystem journey: heading and body, then the stage plate with its step rail. */
export function HomeEcosystemSection({
  data,
  locale,
  animationsEnabled,
}: {
  data: HomepageSettings["homeEcosystem"];
  locale: string;
  animationsEnabled: boolean;
}) {
  const t = useTranslations("homeEcosystem");
  const isStatic = useEcosystemStatic(animationsEnabled);
  const stageRef = useRef<HTMLDivElement>(null);
  const seq = useEcosystemSequence({ count: data.stages.length, isStatic, ref: stageRef });
  const pick = (v: HomepageSettings["homeEcosystem"]["title"]) => pickLocalized(v, locale);
  const bodyParagraphs = [pick(data.bodyP1), pick(data.bodyP2)];

  return (
    <section
      aria-label={t("ariaLabel")}
      className="relative z-10 overflow-x-clip bg-oboya-blue-dark py-[var(--section-y)]"
    >
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-12 px-[var(--container-padding)] md:gap-14">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-x-6 gap-y-6">
          <h2 className="col-span-12 max-w-xl whitespace-pre-line font-display text-[clamp(1.45rem,2.8vw,2.25rem)] font-light leading-[1.3] tracking-tight text-white text-balance lg:col-span-5">
            {pick(data.title)}
          </h2>
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-7 lg:pt-1">
            {bodyParagraphs.map((paragraph, index) => (
              <p
                key={index}
                className="font-body text-[clamp(0.975rem,1.4vw,1.125rem)] font-light leading-[1.65] text-white/90 text-pretty"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Stage row */}
        <div ref={stageRef} className="flex flex-col gap-8 md:gap-10">
          {/* The clock: one CSS animation per phase ends it; pausing is animation-play-state. */}
          {!isStatic && seq.kind !== "idle" ? (
            <span
              key={seq.phase}
              aria-hidden
              className="absolute size-0 overflow-hidden"
              onAnimationEnd={seq.advance}
              style={{
                animation: `eco-fill ${seq.phaseMs}ms linear forwards`,
                animationPlayState: seq.playState,
              }}
            />
          ) : null}

          <HomeEcosystemStage
            data={data}
            locale={locale}
            kind={seq.kind}
            stageIndex={seq.stageIndex}
            isStatic={isStatic}
            playState={seq.playState}
            autoplay={seq.autoplay}
            onHoverChange={seq.setHoverPaused}
          />

          <HomeEcosystemRail
            labels={data.stages.map((s) => pick(s.label))}
            kind={seq.kind}
            stageIndex={seq.stageIndex}
            phase={seq.phase}
            playState={seq.playState}
            autoplay={seq.autoplay}
            isStatic={isStatic}
            onSelect={seq.select}
            onToggle={seq.toggle}
          />
        </div>

        {isStatic ? (
          <div className="flex flex-col gap-3 border-t border-white/15 pt-8">
            <p className="font-display text-[clamp(1.3rem,2.4vw,1.9rem)] font-light leading-snug text-white text-balance">
              {pick(data.closingLine1)} {pick(data.closingLine2)}
            </p>
            <p className="font-body text-[0.95rem] font-light text-white/70">{pick(data.slogan)}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
