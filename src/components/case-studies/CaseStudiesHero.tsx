import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";

export async function CaseStudiesHero() {
  const t = await getTranslations("caseStudies");

  return (
    <section className="bg-oboya-blue-dark pt-[clamp(4.5rem,10vw,7.5rem)] pb-[clamp(4rem,9vw,6.5rem)]">
      <Container>
        <p className="font-body text-[0.9375rem] font-normal leading-relaxed text-white/85 md:text-base">
          {t("heroEyebrow")}
        </p>
        <div className="mt-5 h-px w-full bg-white/25 md:mt-6" aria-hidden />
        <h1 className="mt-7 max-w-3xl font-display text-[clamp(1.5rem,2.9vw,2.375rem)] font-medium leading-[1.35] tracking-[-0.02em] text-white text-pretty md:mt-8 lg:max-w-[68%]">
          {t("heroTitle")}
        </h1>
      </Container>
    </section>
  );
}
