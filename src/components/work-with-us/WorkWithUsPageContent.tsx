"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";

const benefits = ["b1", "b2", "b3", "b4"] as const;
const openings = ["o1", "o2", "o3"] as const;

export function WorkWithUsPageContent() {
  const t = useTranslations("workWithUsPage");
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <section className="py-16 md:py-20">
        <Container>
          <p className="max-w-2xl text-muted-foreground">{t("intro")}</p>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-xl border border-border/60 bg-white p-5 shadow-[var(--shadow-card)]"
              >
                <h3 className="font-semibold text-oboya-blue-dark">
                  {t(`benefits.${benefit}.title`)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`benefits.${benefit}.description`)}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-oboya-soft-white py-16 md:py-20">
        <Container>
          <h2 className="font-display text-2xl font-semibold text-oboya-blue-dark">
            {t("openings.title")}
          </h2>
          <div className="mt-8 grid gap-4">
            {openings.map((opening) => (
              <article
                key={opening}
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold text-oboya-blue-dark">
                    {t(`openings.${opening}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(`openings.${opening}.location`)}
                  </p>
                </div>
                <span className="text-sm font-medium text-oboya-green">
                  {t(`openings.${opening}.type`)}
                </span>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 md:py-20">
        <Container size="narrow">
          <h2 className="font-display text-2xl font-semibold text-oboya-blue-dark">
            {t("application.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("application.description")}</p>
          {submitted ? (
            <p className="mt-8 rounded-xl border border-oboya-green/30 bg-oboya-green/5 px-5 py-4 text-sm text-oboya-blue-dark">
              {t("application.success")}
            </p>
          ) : (
            <form
              className="mt-8 flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <input
                required
                placeholder={t("application.name")}
                className="h-11 rounded-lg border border-border px-4 text-sm"
              />
              <input
                required
                type="email"
                placeholder={t("application.email")}
                className="h-11 rounded-lg border border-border px-4 text-sm"
              />
              <textarea
                required
                rows={4}
                placeholder={t("application.message")}
                className="rounded-lg border border-border px-4 py-3 text-sm"
              />
              <button
                type="submit"
                className={buttonVariants({
                  className:
                    "w-fit rounded-full bg-oboya-green px-8 text-white hover:bg-oboya-green/90",
                })}
              >
                {t("application.submit")}
              </button>
            </form>
          )}
        </Container>
      </section>
    </>
  );
}
