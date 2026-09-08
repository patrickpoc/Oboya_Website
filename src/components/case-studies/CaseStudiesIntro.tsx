import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";

export async function CaseStudiesIntro() {
  const t = await getTranslations("caseStudies");

  return (
    <section className="bg-white py-[var(--section-y)]">
      <Container>
        <div className="mx-auto grid w-full min-w-0 grid-cols-12 items-start gap-x-4 sm:gap-x-6 md:gap-x-9 lg:w-[90%] lg:gap-x-[3.15rem] xl:gap-x-[3.6rem]">
          <h2 className="col-span-6 font-display text-[clamp(1.25rem,3.2vw,3rem)] font-medium leading-[1.15] tracking-[-0.02em] text-oboya-blue-dark">
            {t("introTitle")}
          </h2>
          <p className="col-span-6 font-body text-[0.8125rem] leading-[1.65] text-oboya-blue-dark/55 sm:text-[0.9375rem] sm:leading-[1.75] md:text-base lg:pt-2">
            {t("introBody")}
          </p>
        </div>
      </Container>
    </section>
  );
}
