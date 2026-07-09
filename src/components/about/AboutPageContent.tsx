"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { CallToAction } from "@/components/sections/CallToAction";
import { Certifications } from "@/components/sections/Certifications";
import { Link } from "@/i18n/navigation";

const sectionIds = [
  "history",
  "mission",
  "timeline",
  "presence",
  "certifications",
  "leadership",
  "partners",
] as const;

export function AboutPageContent() {
  const t = useTranslations("aboutPage");

  const values = ["integrity", "innovation", "sustainability"] as const;
  const timeline = ["m1", "m2", "m3", "m4", "m5", "m6"] as const;
  const leaders = ["l1", "l2", "l3", "l4"] as const;
  const partners = ["p1", "p2", "p3", "p4", "p5", "p6"] as const;

  return (
    <>
      <section className="border-b border-border/60 bg-oboya-soft-white py-4">
        <Container>
          <nav className="flex flex-wrap gap-2">
            {sectionIds.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-full border border-border/60 bg-white px-3 py-1.5 text-xs font-medium text-oboya-blue-dark transition-colors hover:border-oboya-green hover:text-oboya-green"
              >
                {t(`nav.${id}`)}
              </a>
            ))}
          </nav>
        </Container>
      </section>

      <section id="history" className="py-16 md:py-20">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-semibold text-oboya-blue-dark md:text-3xl">
                {t("history.title")}
              </h2>
              <p className="mt-4 text-muted-foreground">{t("history.p1")}</p>
              <p className="mt-4 text-muted-foreground">{t("history.p2")}</p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-oboya-blue-dark/5">
              <Image
                src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=1200&auto=format&fit=crop"
                alt={t("history.imageAlt")}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </Container>
      </section>

      <section id="mission" className="bg-oboya-soft-white py-16 md:py-20">
        <Container>
          <h2 className="font-display text-2xl font-semibold text-oboya-blue-dark md:text-3xl">
            {t("mission.title")}
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {(["mission", "vision", "values"] as const).map((key) => (
              <div
                key={key}
                className="rounded-xl border border-border/60 bg-white p-6 shadow-[var(--shadow-card)]"
              >
                <h3 className="text-lg font-semibold text-oboya-blue-dark">
                  {t(`${key}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t(`${key}.description`)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {values.map((value) => (
              <div
                key={value}
                className="rounded-lg border border-oboya-green/20 bg-white px-4 py-3 text-sm font-medium text-oboya-blue-dark"
              >
                {t(`valuesList.${value}`)}
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section id="timeline" className="py-16 md:py-20">
        <Container size="narrow">
          <h2 className="font-display text-2xl font-semibold text-oboya-blue-dark md:text-3xl">
            {t("timeline.title")}
          </h2>
          <ol className="mt-10 space-y-6 border-l-2 border-oboya-green/30 pl-6">
            {timeline.map((item) => (
              <li key={item} className="relative">
                <span className="absolute top-1 -left-[1.9rem] size-3 rounded-full bg-oboya-green" />
                <p className="text-sm font-semibold text-oboya-green">
                  {t(`timeline.${item}.year`)}
                </p>
                <p className="mt-1 font-medium text-oboya-blue-dark">
                  {t(`timeline.${item}.title`)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`timeline.${item}.description`)}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section id="presence" className="bg-oboya-blue-dark py-16 text-white md:py-20">
        <Container>
          <h2 className="font-display text-2xl font-semibold md:text-3xl">
            {t("presence.title")}
          </h2>
          <p className="mt-4 max-w-2xl text-white/80">{t("presence.description")}</p>
          <Link
            href="/#global-presence"
            className="mt-6 inline-flex rounded-full bg-oboya-green px-6 py-2.5 text-sm font-medium text-white hover:bg-oboya-green/90"
          >
            {t("presence.cta")}
          </Link>
        </Container>
      </section>

      <div id="certifications">
        <Certifications />
      </div>

      <section id="leadership" className="py-16 md:py-20">
        <Container>
          <h2 className="font-display text-2xl font-semibold text-oboya-blue-dark md:text-3xl">
            {t("leadership.title")}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {leaders.map((leader) => (
              <article
                key={leader}
                className="rounded-xl border border-border/60 bg-white p-5 shadow-[var(--shadow-card)]"
              >
                <div className="mb-4 aspect-square rounded-lg bg-oboya-soft-white" />
                <h3 className="font-semibold text-oboya-blue-dark">
                  {t(`leadership.${leader}.name`)}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`leadership.${leader}.role`)}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="partners" className="bg-oboya-soft-white py-16 md:py-20">
        <Container>
          <h2 className="font-display text-2xl font-semibold text-oboya-blue-dark md:text-3xl">
            {t("partners.title")}
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {partners.map((partner) => (
              <div
                key={partner}
                className="flex h-20 items-center justify-center rounded-lg border border-border/60 bg-white text-sm font-semibold text-oboya-blue-dark/70"
              >
                {t(`partners.${partner}`)}
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CallToAction />
    </>
  );
}
