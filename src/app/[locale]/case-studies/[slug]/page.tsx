import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { readCaseStudies, readCaseStudyBySlug } from "@/lib/cms/readers";
import { pickLocalized } from "@/lib/cms/utils";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    readCaseStudies().map((item) => ({ locale, slug: item.slug }))
  );
}

export default async function CaseStudyDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const study = readCaseStudyBySlug(slug);
  if (!study) notFound();

  const t = await getTranslations("caseStudies");
  const title = pickLocalized(study.title, locale);
  const metric = pickLocalized(study.metric, locale);
  const excerpt = pickLocalized(study.excerpt, locale);
  const challenge = pickLocalized(study.challenge, locale);
  const solution = pickLocalized(study.solution, locale);
  const results = pickLocalized(study.results, locale);

  const related = readCaseStudies()
    .filter((item) => item.slug !== study.slug && item.status === "published")
    .filter(
      (item) => item.region === study.region || item.industry === study.industry
    )
    .slice(0, 2);

  return (
    <SiteLayout>
      <section className="bg-white pt-[clamp(3.5rem,8vw,5.5rem)]">
        <Container>
          <p className="font-body text-[0.8125rem] font-medium tracking-[0.04em] text-oboya-green">
            {study.industry} · {study.country}
          </p>
          <div className="mt-2.5 h-px w-full max-w-xs bg-oboya-green/55" aria-hidden />
          {metric ? (
            <p className="mt-6 font-display text-[clamp(1.75rem,3.2vw,2.75rem)] font-semibold tracking-[-0.02em] text-oboya-blue-dark">
              {metric}
            </p>
          ) : null}
          <h1 className="mt-3 max-w-3xl font-display text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold leading-[1.25] tracking-[-0.015em] text-oboya-blue-dark text-pretty">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl font-body text-[0.9375rem] leading-relaxed text-oboya-blue-dark/55 md:text-base">
            {excerpt}
          </p>

          <dl className="mt-8 grid gap-4 border-y border-border/60 py-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("factIndustry")}
              </dt>
              <dd className="mt-1 text-sm font-medium text-oboya-blue-dark">
                {study.industry}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("factCountry")}
              </dt>
              <dd className="mt-1 text-sm font-medium text-oboya-blue-dark">
                {study.country}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("factRegion")}
              </dt>
              <dd className="mt-1 text-sm font-medium text-oboya-blue-dark">
                {t(`regions.${study.region}`)}
              </dd>
            </div>
          </dl>
        </Container>
      </section>

      {study.coverImage && (
        <section className="bg-white py-8 md:py-10">
          <div className="relative aspect-[2.35/1] min-h-[200px] w-full overflow-hidden md:min-h-[320px]">
            <Image
              src={study.coverImage}
              alt={title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </section>
      )}

      <section className="bg-white py-12 md:py-16">
        <Container size="narrow">
          <div className="space-y-12">
            <div>
              <h2 className="font-display text-xl font-semibold text-oboya-blue-dark">
                {t("challengeLabel")}
              </h2>
              <div
                className="prose prose-sm mt-3 max-w-none text-oboya-blue-dark/70"
                dangerouslySetInnerHTML={{ __html: challenge }}
              />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-oboya-blue-dark">
                {t("solutionLabel")}
              </h2>
              <div
                className="prose prose-sm mt-3 max-w-none text-oboya-blue-dark/70"
                dangerouslySetInnerHTML={{ __html: solution }}
              />
            </div>
            <div className="rounded-sm bg-oboya-soft-white px-6 py-7 md:px-8">
              <h2 className="font-display text-xl font-semibold text-oboya-blue-dark">
                {t("resultLabel")}
              </h2>
              {metric ? (
                <p className="mt-3 font-display text-2xl font-semibold text-oboya-green">
                  {metric}
                </p>
              ) : null}
              <div
                className="prose prose-sm mt-3 max-w-none text-oboya-blue-dark/70"
                dangerouslySetInnerHTML={{ __html: results }}
              />
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-border/60 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/case-studies"
              className="text-sm font-medium text-oboya-blue-dark hover:text-oboya-green"
            >
              ← {t("backToHub")}
            </Link>
            <Link
              href="/contact"
              className={buttonVariants({
                size: "cta",
                className: "bg-oboya-green text-white hover:bg-oboya-green/90",
              })}
            >
              {t("ctaPrimary")}
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Container>
      </section>

      {related.length > 0 && (
        <section className="border-t border-border/60 bg-oboya-soft-white py-12 md:py-16">
          <Container>
            <h2 className="font-display text-xl font-semibold text-oboya-blue-dark">
              {t("relatedTitle")}
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/case-studies/${item.slug}`}
                  className="group block bg-white p-5 transition-shadow hover:shadow-[var(--shadow-subtle)]"
                >
                  <p className="text-xs uppercase tracking-wide text-oboya-green">
                    {item.industry} · {item.country}
                  </p>
                  <p className="mt-2 font-semibold text-oboya-blue-dark group-hover:text-oboya-green">
                    {pickLocalized(item.metric, locale)}
                  </p>
                  <p className="mt-1 text-sm text-oboya-blue-dark/70">
                    {pickLocalized(item.title, locale)}
                  </p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}
    </SiteLayout>
  );
}
