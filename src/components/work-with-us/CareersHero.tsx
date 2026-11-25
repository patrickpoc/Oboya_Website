import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";

export function CareersHero() {
  const t = useTranslations("workWithUsPage.intro");
  return (
    <section className="bg-white py-20 md:py-24">
      <Container className="text-center">
        <h1 className="font-display text-[clamp(2.25rem,4.5vw,3.5rem)] leading-tight font-light text-oboya-blue-dark">
          {t("eyebrow")}
        </h1>
        <p className="mx-auto mt-5 max-w-3xl font-body text-[clamp(1.125rem,1.8vw,1.5rem)] leading-snug font-light text-oboya-blue-dark/80">
          {t("title")}
        </p>
      </Container>
    </section>
  );
}
