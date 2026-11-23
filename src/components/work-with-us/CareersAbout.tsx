import Image from "next/image";
import { useTranslations } from "next-intl";
import { CircleCheck } from "lucide-react";

const BENEFITS = ["b1", "b2", "b3", "b4"] as const;

export function CareersAbout() {
  const t = useTranslations("workWithUsPage.why");
  return (
    <>
      <section className="grid lg:grid-cols-[45fr_55fr]" aria-labelledby="careers-why">
        <div className="bg-oboya-blue-dark px-[var(--container-padding)] py-14 text-white lg:px-16 lg:py-20">
          <h2 id="careers-why" className="font-display text-[clamp(1.8rem,3vw,2.4rem)] leading-tight font-light">
            {t("title")}
          </h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/85">{t("p1")}</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85">{t("p2")}</p>
        </div>
        <ul className="grid content-center gap-x-10 gap-y-8 bg-oboya-soft-white px-[var(--container-padding)] py-14 sm:grid-cols-2 lg:px-16 lg:py-20">
          {BENEFITS.map((key) => (
            <li key={key} className="flex gap-3">
              <CircleCheck className="mt-0.5 size-5 shrink-0 text-oboya-green" strokeWidth={1.5} aria-hidden />
              <div>
                <p className="text-sm font-bold text-oboya-blue-dark">{t(`${key}.title`)}</p>
                <p className="mt-1 text-sm leading-relaxed text-oboya-blue-dark">{t(`${key}.description`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
        <Image
          src="/assets/homepage/capabilities-partnerships.jpg"
          alt={t("photoAlt")}
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>
    </>
  );
}
