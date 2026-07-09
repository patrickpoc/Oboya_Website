import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { InnerPageHero } from "@/components/sections/InnerPageHero";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { caseStudies } from "@/constants/content-data";

type Props = { params: Promise<{ locale: string }> };

export default async function CaseStudiesIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("caseStudies");

  return (
    <SiteLayout>
      <InnerPageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <section className="py-12 md:py-16">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            {caseStudies.map((item) => (
              <article
                key={item.slug}
                className="rounded-xl border border-border/60 bg-white p-6 shadow-[var(--shadow-card)]"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-oboya-green">
                  {item.industry} · {item.country}
                </p>
                <h2 className="mt-2 text-lg font-semibold text-oboya-blue-dark">
                  {t(`items.${item.messageKey}.title`)}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  {t(`items.${item.messageKey}.excerpt`)}
                </p>
                <Link
                  href={`/case-studies/${item.slug}`}
                  className="mt-4 inline-block text-sm font-medium text-oboya-green hover:underline"
                >
                  {t("readMore")}
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
}
