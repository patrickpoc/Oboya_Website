"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";

export function LoremContent() {
  const t = useTranslations("common");

  return (
    <section className="py-16 md:py-20">
      <Container size="narrow">
        <div className="flex flex-col gap-6">
          <p className="text-[var(--text-body)] leading-[var(--text-body-leading)] text-muted-foreground">
            {t("loremP1")}
          </p>
          <p className="text-[var(--text-body)] leading-[var(--text-body-leading)] text-muted-foreground">
            {t("loremP2")}
          </p>
          <p className="text-[var(--text-body)] leading-[var(--text-body-leading)] text-muted-foreground">
            {t("loremP3")}
          </p>
          <p className="text-[var(--text-body)] leading-[var(--text-body-leading)] text-muted-foreground">
            {t("loremP4")}
          </p>
        </div>
      </Container>
    </section>
  );
}
