import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";

const STEPS = ["s1", "s2", "s3", "s4"] as const;

export function HiringProcess() {
  const t = useTranslations("workWithUsPage.process");
  return (
    <section className="bg-white py-16 md:py-24" aria-labelledby="careers-process">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="careers-process" className="font-display text-2xl font-semibold text-oboya-blue-dark md:text-3xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-base text-oboya-blue-dark/75">{t("description")}</p>
        </div>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s} className="relative rounded-sm bg-oboya-soft-white p-6">
              <span className="flex size-9 items-center justify-center rounded-full bg-oboya-blue-dark text-sm font-semibold text-white">
                {i + 1}
              </span>
              <p className="mt-4 font-display text-lg font-semibold text-oboya-blue-dark">{t(`steps.${s}.title`)}</p>
              <p className="mt-2 text-sm text-oboya-blue-dark/70">{t(`steps.${s}.description`)}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
