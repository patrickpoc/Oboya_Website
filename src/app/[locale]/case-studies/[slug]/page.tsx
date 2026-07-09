import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { InnerPageHero } from "@/components/sections/InnerPageHero";
import { Container } from "@/components/ui/container";
import { caseStudies } from "@/constants/content-data";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    caseStudies.map((item) => ({ locale, slug: item.slug }))
  );
}

export default async function CaseStudyDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const item = caseStudies.find((study) => study.slug === slug);
  if (!item) notFound();

  const t = await getTranslations("caseStudies");
  const key = item.messageKey;

  return (
    <SiteLayout>
      <InnerPageHero
        eyebrow={`${item.industry} · ${item.country}`}
        title={t(`items.${key}.title`)}
        description={t(`items.${key}.challenge`)}
      />
      <section className="py-12 md:py-16">
        <Container size="narrow">
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-oboya-blue-dark">
                {t("challengeLabel")}
              </h2>
              <p className="mt-2 text-muted-foreground">{t(`items.${key}.challenge`)}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-oboya-blue-dark">
                {t("solutionLabel")}
              </h2>
              <p className="mt-2 text-muted-foreground">{t(`items.${key}.solution`)}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-oboya-blue-dark">
                {t("resultLabel")}
              </h2>
              <p className="mt-2 text-muted-foreground">{t(`items.${key}.result`)}</p>
            </div>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
}
