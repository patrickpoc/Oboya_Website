import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";

export function CareersHero() {
  const t = useTranslations("workWithUsPage.intro");
  return (
    <section className="bg-white py-20 md:py-24">
      <Container className="text-center">
        <p className="text-sm font-semibold text-oboya-blue-dark">{t("eyebrow")}</p>
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-[clamp(1.75rem,3.6vw,2.6rem)] leading-tight font-light text-oboya-blue-dark">
          {t("title")}
        </h1>
      </Container>
    </section>
  );
}
