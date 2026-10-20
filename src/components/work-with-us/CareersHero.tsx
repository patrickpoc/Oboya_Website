import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";

export function CareersHero({ countriesCount }: { countriesCount: number }) {
  const t = useTranslations("workWithUsPage.hero");
  return (
    <section className="bg-oboya-blue-dark pb-36 pt-16 md:pb-44 md:pt-20">
      <Container className="text-center">
        <p className="text-sm font-medium tracking-wide text-white/80">{t("eyebrow")}</p>
        <h1 className="mx-auto mt-6 max-w-3xl font-display text-[length:var(--text-heading)] leading-[var(--text-heading-leading)] text-white">
          {t("title")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-white/80">{t("description")}</p>
        {countriesCount > 0 ? (
          <ul className="mt-6 flex justify-center text-sm text-white">
            <li className="rounded-full bg-white/10 px-4 py-1.5">{t("countriesCount", { count: countriesCount })}</li>
          </ul>
        ) : null}
        <Link
          href="/work/apply"
          className="mt-6 inline-flex min-h-11 items-center rounded-full border border-white/60 px-6 text-sm font-semibold tracking-wider text-white uppercase transition-colors hover:bg-white hover:text-oboya-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {t("ctaTalentPool")}
        </Link>
      </Container>
    </section>
  );
}
