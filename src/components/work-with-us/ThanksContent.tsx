"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Clock, Mail, Search } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";

const STEPS = [
  { key: "review", Icon: Search },
  { key: "contact", Icon: Clock },
  { key: "email", Icon: Mail },
] as const;

const btn =
  "inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold tracking-wider uppercase transition-colors";

export function ThanksContent({ openingTitle, talentPool = false }: { openingTitle?: string | null; talentPool?: boolean }) {
  const t = useTranslations("workWithUsPage.thanks");
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="bg-oboya-soft-white">
      <section className="bg-oboya-blue-dark pb-36 pt-16 md:pb-44 md:pt-20">
        <Container className="text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-oboya-green/20">
            <CheckCircle2 className="size-9 text-oboya-green-light" aria-hidden />
          </span>
          <p className="mt-6 text-sm font-medium tracking-wide text-white/80">{t("eyebrow")}</p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mx-auto mt-4 max-w-3xl font-display text-[length:var(--text-heading)] leading-[var(--text-heading-leading)] text-white outline-none"
          >
            {talentPool ? t("talentPoolTitle") : t("title")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/80">
            {talentPool ? t("talentPoolLine") : openingTitle ? t("openingLine", { title: openingTitle }) : t("genericLine")}
          </p>
        </Container>
      </section>

      <section className="relative -mt-20 pb-20 md:-mt-36 md:pb-28">
        <Container size="wide">
          <div className="rounded-sm bg-white px-4 py-8 shadow-[var(--shadow-card)] sm:px-8 md:px-12 md:py-12">
            <h2 className="font-display text-xl font-semibold text-oboya-blue-dark md:text-2xl">{t("nextTitle")}</h2>
            <ol className="mt-6 grid gap-6 md:grid-cols-3">
              {STEPS.map(({ key, Icon }, i) => (
                <li key={key} className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-oboya-blue-dark text-white">
                    <Icon className="size-4" aria-hidden />
                    <span className="sr-only">{i + 1}</span>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-oboya-blue-dark">{t(`steps.${key}.title`)}</p>
                    <p className="text-sm text-oboya-blue-dark/70">{t(`steps.${key}.description`)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-8 text-sm text-oboya-blue-dark/80">
              {t("privacy")}{" "}
              <Link href="/privacy#recruitment" className="text-oboya-blue underline underline-offset-2 hover:text-oboya-blue-light">
                {t("privacyLink")}
              </Link>
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/work" className={`${btn} bg-oboya-blue-dark text-white hover:bg-oboya-blue`}>
                {t("seeOpenings")}
              </Link>
              <Link
                href="/"
                className={`${btn} border border-oboya-blue-dark text-oboya-blue-dark hover:bg-oboya-blue-dark hover:text-white`}
              >
                {t("backHome")}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
