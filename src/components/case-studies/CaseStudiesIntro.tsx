import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";

export async function CaseStudiesIntro() {
  const t = await getTranslations("caseStudies");

  return (
    <section className="bg-white py-[var(--section-y)]">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
          <h2 className="font-display text-[clamp(1.875rem,4vw,3rem)] font-medium leading-[1.15] tracking-[-0.02em] text-oboya-blue-dark lg:col-span-5">
            {t("introTitle")}
          </h2>
          <p className="max-w-xl font-body text-[0.9375rem] leading-[1.75] text-oboya-blue-dark/55 md:text-base lg:col-span-6 lg:col-start-7 lg:pt-2">
            {t("introBody")}
          </p>
        </div>
      </Container>
    </section>
  );
}
