import { useTranslations } from "next-intl";
import { Globe, GraduationCap, Sprout, Users } from "lucide-react";
import { Container } from "@/components/ui/container";

const BENEFITS = [
  { key: "b1", Icon: Globe },
  { key: "b2", Icon: GraduationCap },
  { key: "b3", Icon: Sprout },
  { key: "b4", Icon: Users },
] as const;

export function CareersAbout() {
  const t = useTranslations("workWithUsPage");
  return (
    <section className="py-16 md:py-24" aria-labelledby="careers-about">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="careers-about" className="font-display text-2xl font-semibold text-oboya-blue-dark md:text-3xl">
            {t("about.title")}
          </h2>
          <p className="mt-4 text-base text-oboya-blue-dark/75">{t("about.body")}</p>
        </div>
        <h3 className="sr-only">{t("about.highlightsTitle")}</h3>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ key, Icon }) => (
            <li key={key} className="rounded-sm bg-white p-6 shadow-sm">
              <Icon className="size-6 text-oboya-green" aria-hidden />
              <p className="mt-4 font-display text-lg font-semibold text-oboya-blue-dark">
                {t(`benefits.${key}.title`)}
              </p>
              <p className="mt-2 text-sm text-oboya-blue-dark/70">{t(`benefits.${key}.description`)}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
