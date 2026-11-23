"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";

export function ContactIntroStep({ onStart }: { onStart: () => void }) {
  const t = useTranslations("contact.intro");

  return (
    <>
      <section className="bg-oboya-blue-dark pb-36 pt-16 md:pb-44 md:pt-20">
        <Container className="text-center">
          <p className="text-sm font-semibold tracking-wide text-white">
            {t("eyebrow")}
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-[length:clamp(1.75rem,3.4vw,2.5rem)] font-light leading-[1.2] text-white">
            {t("title")}
          </h1>
        </Container>
      </section>

      <section className="relative -mt-24 md:-mt-32">
        <Container>
          <div className="grid overflow-hidden rounded-sm bg-oboya-soft-white shadow-[var(--shadow-card)] md:grid-cols-[45fr_55fr]">
            <div className="relative aspect-[4/3] md:aspect-auto md:min-h-80">
              {/* Placeholder team photo */}
              <Image
                src="/assets/homepage/capabilities-partnerships.jpg"
                alt={t("imageAlt")}
                fill
                sizes="(min-width: 768px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center gap-5 px-6 py-10 text-oboya-blue-dark md:px-12 md:py-14">
              <p className="text-base leading-relaxed">{t("body")}</p>
              <p className="text-base font-bold leading-relaxed">
                {t("emphasis")}
              </p>
              <button
                type="button"
                onClick={onStart}
                className="group mt-2 inline-flex min-h-11 w-fit items-center gap-3 text-sm font-semibold text-oboya-blue-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-oboya-blue-light"
              >
                <span className="flex size-8 items-center justify-center rounded-full border border-oboya-orange transition-colors group-hover:bg-oboya-orange group-hover:text-white">
                  <ChevronRight className="size-4" aria-hidden />
                </span>
                {t("cta")}
              </button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
