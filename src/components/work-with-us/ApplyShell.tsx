import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { ApplicationForm } from "./ApplicationForm";

const STEPS = ["s1", "s2", "s3", "s4"] as const;

/** Contact-page card layout: aside with context + steps, form on the right. */
export function ApplyShell({ opening }: { opening: { slug: string; title: string } | null }) {
  const t = useTranslations("workWithUsPage");
  return (
    <div className="bg-oboya-soft-white">
      <section className="bg-oboya-blue-dark pb-36 pt-16 md:pb-44 md:pt-20">
        <Container className="text-center">
          <p className="text-sm font-medium tracking-wide text-white/80">
            {opening ? t("apply.applyingFor", { title: opening.title }) : t("hero.eyebrow")}
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-[length:var(--text-heading)] leading-[var(--text-heading-leading)] text-white">
            {opening ? t("apply.title") : t("apply.talentPoolTitle")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/80">
            {opening ? t("apply.subtitle") : t("apply.talentPoolSubtitle")}
          </p>
        </Container>
      </section>

      <section className="relative -mt-20 pb-20 md:-mt-36 md:pb-28">
        <Container size="wide">
          <div className="grid overflow-hidden rounded-sm bg-white shadow-[var(--shadow-card)] md:grid-cols-[minmax(240px,0.38fr)_1fr]">
            <aside className="flex flex-col gap-8 bg-oboya-soft-white px-4 py-8 sm:px-8 md:px-10 md:py-12">
              <Link
                href={opening ? `/work/${opening.slug}` : "/work"}
                className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-oboya-blue underline-offset-2 hover:underline"
              >
                <ArrowLeft className="size-4" aria-hidden />
                {opening ? t("apply.backToOpening") : t("detail.backToOpenings")}
              </Link>
              <div>
                <h2 className="font-display text-xl font-semibold text-oboya-blue-dark md:text-2xl">
                  {t("apply.nextStepsTitle")}
                </h2>
                <ol className="mt-5 flex flex-col gap-5">
                  {STEPS.map((s, i) => (
                    <li key={s} className="flex gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-oboya-blue-dark text-xs font-semibold text-white">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-oboya-blue-dark">{t(`process.steps.${s}.title`)}</p>
                        <p className="text-sm text-oboya-blue-dark/70">{t(`process.steps.${s}.description`)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
            <div className="px-4 py-8 sm:px-8 md:px-12 md:py-12">
              <ApplicationForm opening={opening} />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
