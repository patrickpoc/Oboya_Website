import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";

export async function CaseStudiesIntro() {
  const t = await getTranslations("caseStudies");

  return (
    <section className="bg-white pt-[clamp(2rem,4vw,3.25rem)] pb-[clamp(4rem,8vw,6.5rem)]">
      <Container>
        <div className="mx-auto grid w-full min-w-0 grid-cols-12 items-start gap-x-4 sm:gap-x-5 md:gap-x-8 lg:w-[90%] lg:gap-x-10">
          <h2 className="col-span-6 font-display text-[clamp(1.5rem,3.2vw,2.75rem)] font-light leading-[1.15] tracking-[-0.02em] text-oboya-blue-dark text-pretty">
            {t.rich("introTitle", {
              br: () => <br />,
            })}
          </h2>
          <p className="col-span-6 font-body text-[0.75rem] leading-[1.6] text-oboya-blue-dark/55 sm:text-[0.8125rem] sm:leading-[1.65] md:text-[0.875rem] md:leading-[1.7] lg:pt-0.5">
            {t("introBody")}
          </p>
        </div>
      </Container>
    </section>
  );
}
