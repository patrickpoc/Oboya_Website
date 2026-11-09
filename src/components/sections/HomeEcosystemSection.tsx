"use client";

import { useTranslations } from "next-intl";
import {
  HomeEcosystemIntro,
  useEcosystemStatic,
} from "@/components/sections/HomeEcosystemIntro";
import { pickLocalized } from "@/lib/cms/utils";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";

/** Ecosystem journey: heading and body, then the looping stage sequence. */
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
  const bodyParagraphs = [pickLocalized(data.bodyP1, locale), pickLocalized(data.bodyP2, locale)];

  return (
    <section
      aria-label={t("ariaLabel")}
      className="relative z-10 overflow-x-clip bg-oboya-blue-dark py-[var(--section-y)]"
    >
      <HomeEcosystemIntro data={data} locale={locale} isStatic={isStatic} />

      <div className="mx-auto mt-12 w-full max-w-[var(--container-max)] px-[var(--container-padding)]">
        <div className="grid gap-6 md:grid-cols-2 md:items-start md:gap-10 lg:gap-16">
          <h2 className="max-w-xl whitespace-pre-line font-display text-[clamp(1.45rem,2.8vw,2.25rem)] font-light leading-[1.3] tracking-tight text-white text-balance">
            {pickLocalized(data.title, locale)}
          </h2>
          <div className="flex flex-col gap-4 md:pt-1">
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
      </div>
    </section>
  );
}
