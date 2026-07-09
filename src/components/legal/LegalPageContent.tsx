"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";

const sections = ["s1", "s2", "s3", "s4", "s5"] as const;

export function LegalPageContent() {
  const t = useTranslations("legalPage");

  return (
    <section className="py-16 md:py-20">
      <Container size="narrow">
        <p className="mb-10 text-sm text-muted-foreground">{t("updated")}</p>
        <div className="space-y-10">
          {sections.map((section) => (
            <article key={section}>
              <h2 className="text-lg font-semibold text-oboya-blue-dark">
                {t(`${section}.title`)}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t(`${section}.body`)}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
