import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/constants/site";
import { Link } from "@/i18n/navigation";
import type { PublicJobOpening } from "@/lib/cms/careers/public";
import { ApplyCard, MobileApplyBar } from "./ApplyCard";
import { JobPostingJsonLd } from "./JobPostingJsonLd";
import { OpeningMetaChips } from "./OpeningMetaChips";
import { OpeningRichSection } from "./OpeningRichSection";
import { OtherOpenings } from "./OtherOpenings";
import { formatDate, formatMoney } from "./opening-format";

export function OpeningDetail({ opening, all }: { opening: PublicJobOpening; all: PublicJobOpening[] }) {
  const t = useTranslations("workWithUsPage.detail");
  const tl = useTranslations("workWithUsPage.labels.salaryPeriod");
  const locale = useLocale();
  const url = `${siteConfig.url}/${locale}/work/${opening.slug}`;

  let salary: string | undefined;
  if (opening.salary) {
    const { min, max, currency, period } = opening.salary;
    const p = tl(period);
    const fmt = (n: number) => formatMoney(n, currency, locale);
    if (min !== undefined && max !== undefined) salary = t("salaryRange", { min: fmt(min), max: fmt(max), period: p });
    else if (min !== undefined) salary = t("salaryFrom", { min: fmt(min), period: p });
    else if (max !== undefined) salary = t("salaryUpTo", { max: fmt(max), period: p });
  }

  const sections = [
    { id: "sec-description", title: t("sections.description"), html: opening.descriptionHtml },
    { id: "sec-responsibilities", title: t("sections.responsibilities"), html: opening.responsibilitiesHtml },
    { id: "sec-requirements", title: t("sections.requirements"), html: opening.requirementsHtml },
    { id: "sec-nice", title: t("sections.niceToHave"), html: opening.niceToHaveHtml },
    { id: "sec-benefits", title: t("sections.benefits"), html: opening.benefitsHtml },
  ];

  return (
    <div className="bg-oboya-soft-white pb-20 lg:pb-0">
      <JobPostingJsonLd opening={opening} locale={locale} />
      <section className="bg-oboya-blue-dark pb-32 pt-10 md:pb-40 md:pt-14">
        <Container size="wide">
          <nav aria-label={t("breadcrumbLabel")} className="text-sm text-white/70">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-white hover:underline">
                  {t("breadcrumbHome")}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href="/work" className="hover:text-white hover:underline">
                  {t("breadcrumbWork")}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-white">
                {opening.title}
              </li>
            </ol>
          </nav>
          <h1 className="mt-6 max-w-4xl font-display text-[length:var(--text-heading)] leading-[var(--text-heading-leading)] text-white">
            {opening.title}
          </h1>
          <OpeningMetaChips opening={opening} tone="dark" className="mt-6" />
          <p className="mt-5 text-sm text-white/70">
            {t("posted", { date: formatDate(opening.postedAt, locale) })}
            {opening.positions > 1 ? ` · ${t("positions", { count: opening.positions })}` : ""}
            {opening.closeAt ? ` · ${t("closes", { date: formatDate(opening.closeAt, locale) })}` : ""}
          </p>
        </Container>
      </section>

      <Container size="wide" className="relative -mt-20 pb-16 md:-mt-28 md:pb-24">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <article className="divide-y divide-border/50 rounded-sm bg-white p-6 shadow-[var(--shadow-card)] md:p-10">
            {opening.summary ? (
              <section aria-labelledby="sec-summary" className="pb-6">
                <h2 id="sec-summary" className="font-display text-xl font-semibold text-oboya-blue-dark md:text-2xl">
                  {t("sections.summary")}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-oboya-blue-dark/80">{opening.summary}</p>
              </section>
            ) : null}
            {sections.map((s) => (
              <OpeningRichSection key={s.id} {...s} />
            ))}
            <div className="pt-6">
              <Link href="/work" className="text-sm font-medium text-oboya-blue underline-offset-2 hover:underline">
                ← {t("backToOpenings")}
              </Link>
            </div>
          </article>
          <ApplyCard opening={opening} salary={salary} url={url} />
        </div>
      </Container>

      <OtherOpenings current={opening} all={all} />
      <MobileApplyBar slug={opening.slug} />
    </div>
  );
}
